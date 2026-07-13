public class SupportParticipantController {
    
    @AuraEnabled
    public static Id saveParticipants(String participantJson){
    
        Savepoint sp = Database.setSavepoint();
    
        try{
    
            Map<String,Object> payload = (Map<String,Object>)JSON.deserializeUntyped(participantJson);
    
            User currentUser = [
                SELECT Id,Organization_Name__c,Email
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];
    
            List<Organisation__c> organisationList = [
                SELECT Id,Name
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];
    
            if(organisationList.isEmpty()){
                throw new AuraHandledException('No Organization record found for logged-in user.');
            }
    
            Id orgId = organisationList[0].Id;
            Id participantId = (Id)payload.get('id');
    
            List<Object> selectedServiceTypes = (List<Object>)payload.get('selectedServiceTypes');
    
            Support_Client__c participant;
    
            if(participantId != null){
    
                participant = [
                    SELECT Id
                    FROM Support_Client__c
                    WHERE Id = :participantId
                    LIMIT 1
                ];
    
            }else{
    
                participant = new Support_Client__c();
            }
    
            participant.First_Name__c = (String)payload.get('firstName');
            participant.Last_Name__c = (String)payload.get('lastName');
            participant.NDIS_Number__c = toDecimal(payload.get('ndisNumber'));
            participant.Phone__c = (String)payload.get('phone');
            participant.Email__c = (String)payload.get('email');
            participant.Classification1__c = (String)payload.get('selectedClassification');
            participant.Type_Of_Industry__c = (String)payload.get('selectedTypeOfIndustry');
            participant.About_Participant1__c = (String)payload.get('aboutParticipant');
            participant.Address__Street__s = (String)payload.get('street');
            participant.Address__City__s = (String)payload.get('city');
            participant.Address__StateCode__s = (String)payload.get('province');
            participant.Address__PostalCode__s = (String)payload.get('postalcode');
            participant.Address__CountryCode__s = 'AU';
            participant.Status__c = (String)payload.get('status');
            participant.Risk_Level__c = (String)payload.get('riskLevel');
            participant.Organization__c = orgId;
    
            if(payload.get('dob') != null){
                participant.Date_Of_Birth__c = Date.valueOf((String)payload.get('dob'));
            }
    
            if(payload.get('planStart') != null){
                participant.Plan_Start_Date__c = Date.valueOf((String)payload.get('planStart'));
            }
    
            if(payload.get('planEnd') != null){
                participant.Plan_End_Date__c = Date.valueOf((String)payload.get('planEnd'));
            }
    
            participant.Total_Plan_Budget__c = toDecimal(payload.get('planBudget'));
            participant.Budget_Spent_to_Date__c = toDecimal(payload.get('budgetSpent'));
            participant.Provider_Budget__c = toDecimal(payload.get('providerBudget'));
            participant.Support_Coordinator_Budget__c = toDecimal(payload.get('supportCoordinationBudget'));
    
            if(selectedServiceTypes != null){
    
                List<String> serviceTypeStrings = new List<String>();
    
                for(Object obj : selectedServiceTypes){
                    serviceTypeStrings.add(String.valueOf(obj));
                }
    
                participant.Selected_Service_Types__c = String.join(serviceTypeStrings,';');
            }
    
            if(participantId != null){
                update participant;
            }else{
                insert participant;
                participantId = participant.Id;
            }
    
            List<Object> serviceGroups = (List<Object>)payload.get('serviceGroups');
    
            List<Support_CatalogueGroup__c> existingGroups = [
                SELECT Id,Name,State__c
                FROM Support_CatalogueGroup__c
                WHERE SupportCatalogueGroup_To_SupportClient__c = :participantId
            ];
    
            Map<Id,Support_CatalogueGroup__c> existingGroupMap = new Map<Id,Support_CatalogueGroup__c>(existingGroups);
            Set<Id> uiGroupIds = new Set<Id>();
            List<Support_CatalogueGroup__c> groupsToInsert = new List<Support_CatalogueGroup__c>();
            List<Support_CatalogueGroup__c> groupsToUpdate = new List<Support_CatalogueGroup__c>();
    
            if(serviceGroups != null){
                for(Object obj : serviceGroups){
                    Map<String,Object> serviceGroup = (Map<String,Object>)obj;
                    Id groupId = (Id)serviceGroup.get('id');
    
                    Support_CatalogueGroup__c sg;
    
                    if(groupId != null && existingGroupMap.containsKey(groupId)){
                        sg = existingGroupMap.get(groupId);
                        uiGroupIds.add(groupId);
    
                    }else{
                        sg = new Support_CatalogueGroup__c();
                        sg.SupportCatalogueGroup_To_SupportClient__c = participantId;
                    }
    
                    sg.Name = (String)serviceGroup.get('serviceType');
                    sg.State__c = (String)serviceGroup.get('state');
                    sg.BudgetAllocation__c = toDecimal(serviceGroup.get('budgetAllocation'));
                    sg.AmountSpent__c = toDecimal(serviceGroup.get('amountSpent'));
                    sg.Budget_Spent_to_Date__c = toDecimal(serviceGroup.get('budgetSpentToDate'));
                    sg.Organization_To_Support_CatalogueGroup__c = orgId;
    
                    if(groupId != null){
                        groupsToUpdate.add(sg);
                    }else{
                        groupsToInsert.add(sg);
                    }
                }
    
                if(!groupsToInsert.isEmpty()){
                    insert groupsToInsert;
                }
    
                if(!groupsToUpdate.isEmpty()){
                    update groupsToUpdate;
                }
    
               /* List<Support_CatalogueGroup__c> groupsToDelete = new List<Support_CatalogueGroup__c>();
    
                for(Support_CatalogueGroup__c oldGroup : existingGroupMap.values()){
    
                    if(!uiGroupIds.contains(oldGroup.Id)){
                        groupsToDelete.add(oldGroup);
                    }
                }
    
                if(!groupsToDelete.isEmpty()){
                    delete groupsToDelete;
                }*/
            }
    
            Map<String,Id> serviceGroupMap = new Map<String,Id>();
    
            for(Support_CatalogueGroup__c sg : groupsToInsert){
                serviceGroupMap.put(sg.Name + '-' + sg.State__c,sg.Id);
            }
    
            for(Support_CatalogueGroup__c sg : groupsToUpdate){
                serviceGroupMap.put(sg.Name + '-' + sg.State__c,sg.Id);
            }
    
            List<Support_Catalogue__c> existingItems = [
                SELECT Id,CatalogueGroup_To_SupportCatalogue__c
                FROM Support_Catalogue__c
                WHERE CatalogueGroup_To_SupportCatalogue__c IN :existingGroupMap.keySet()
            ];
    
            Map<Id,Support_Catalogue__c> existingItemMap = new Map<Id,Support_Catalogue__c>(existingItems);
            Set<Id> uiItemIds = new Set<Id>();
            List<Support_Catalogue__c> itemsToInsert = new List<Support_Catalogue__c>();
            List<Support_Catalogue__c> itemsToUpdate = new List<Support_Catalogue__c>();
    
            if(serviceGroups != null){
    
                for(Object obj : serviceGroups){
    
                    Map<String,Object> serviceGroup = (Map<String,Object>)obj;
    
                    List<Object> supportItems = (List<Object>)serviceGroup.get('supportItems');
    
                    if(supportItems == null){
                        continue;
                    }
    
                    for(Object itemObj : supportItems){
                        Map<String,Object> item = (Map<String,Object>)itemObj;
                        Id itemId = (Id)item.get('id');
                        Support_Catalogue__c si;
    
                        if(itemId != null && existingItemMap.containsKey(itemId)){
                            si = existingItemMap.get(itemId);
                            uiItemIds.add(itemId);
                        }else{
    
                            si = new Support_Catalogue__c();
                        }
    
                        String groupKey = (String)serviceGroup.get('serviceType') + '-' + (String)serviceGroup.get('state');
    
                        si.CatalogueGroup_To_SupportCatalogue__c = serviceGroupMap.get(groupKey);
                        si.Support_Item_Name__c = (String)item.get('supportItemName');
                        si.Support_Item_Number__c = (String)item.get('supportItemNumber');
                        si.State__c = (String)item.get('state');
                        si.Amount__c = toDecimal(item.get('amount'));
                        si.IsActive__c = (Boolean)item.get('isActive');
    					si.Preffered_Staff__c = (String)item.get('preferredStaff');
                        if(itemId != null){
    
                            itemsToUpdate.add(si);
    
                        }else{
    
                            itemsToInsert.add(si);
                        }
                    }
                }
    
                if(!itemsToInsert.isEmpty()){
                    insert itemsToInsert;
                }
    
                if(!itemsToUpdate.isEmpty()){
                    update itemsToUpdate;
                }
    
              /*  List<Support_Catalogue__c> itemsToDelete = new List<Support_Catalogue__c>();
    
                for(Support_Catalogue__c oldItem : existingItemMap.values()){
    
                    if(!uiItemIds.contains(oldItem.Id)){
                        itemsToDelete.add(oldItem);
                    }
                }
    
                if(!itemsToDelete.isEmpty()){
                    delete itemsToDelete;
                }*/
            }
    
            Map<String,Id> supportItemMap = new Map<String,Id>();
    
            for(Support_Catalogue__c si : itemsToInsert){
                supportItemMap.put(si.Support_Item_Number__c + '-' + si.State__c,si.Id);
            }
    
            for(Support_Catalogue__c si : itemsToUpdate){
                supportItemMap.put(si.Support_Item_Number__c + '-' + si.State__c,si.Id);
            }
    
            List<Support_Child_Provider__c> existingChildProviders = [
                SELECT Id,Support_Catalogue__c,Support_Provider__c
                FROM Support_Child_Provider__c
                WHERE Support_Catalogue__c IN :existingItemMap.keySet()
            ];
    
            Map<String,Support_Child_Provider__c> existingProviderMap = new Map<String,Support_Child_Provider__c>();
    
            for(Support_Child_Provider__c cp : existingChildProviders){
                String key = cp.Support_Catalogue__c + '-' + cp.Support_Provider__c;
                existingProviderMap.put(key,cp);
            }
    
            Set<String> uiProviderKeys = new Set<String>();
            List<Support_Child_Provider__c> childProvidersToInsert = new List<Support_Child_Provider__c>();
    
            if(serviceGroups != null){
                for(Object obj : serviceGroups){
                    Map<String,Object> serviceGroup = (Map<String,Object>)obj;
                    List<Object> supportItems = (List<Object>)serviceGroup.get('supportItems');
    
                    if(supportItems == null){
                        continue;
                    }
    
                    for(Object itemObj : supportItems){
    
                        Map<String,Object> item = (Map<String,Object>)itemObj;
                        List<Object> providerIds = (List<Object>)item.get('providerIds');
    
                        if(providerIds == null){
                            continue;
                        }
    
                        String itemKey = (String)item.get('supportItemNumber') + '-' + (String)item.get('state');
                        Id supportItemId = supportItemMap.get(itemKey);
    
                        for(Object providerId : providerIds){
    
                            String providerKey = supportItemId + '-' + (String)providerId;
                            uiProviderKeys.add(providerKey);
    
                            if(!existingProviderMap.containsKey(providerKey)){
    
                                Support_Child_Provider__c cp = new Support_Child_Provider__c();
    
                                cp.Support_Catalogue__c = supportItemId;
                                cp.Support_Provider__c = (String)providerId;
    
                                childProvidersToInsert.add(cp);
                            }
                        }
                    }
                }
    
                if(!childProvidersToInsert.isEmpty()){
                    insert childProvidersToInsert;
                }
    
                List<Support_Child_Provider__c> childProvidersToDelete = new List<Support_Child_Provider__c>();
    
                for(String key : existingProviderMap.keySet()){
    
                    if(!uiProviderKeys.contains(key)){
                        childProvidersToDelete.add(existingProviderMap.get(key));
                    }
                }
    
                if(!childProvidersToDelete.isEmpty()){
                    delete childProvidersToDelete;
                }
            }
    
            List<Object> coordinatorServiceGroups = (List<Object>)payload.get('coordinatorServiceGroups');
    
            List<Support_CoordinatorCatalogueGroup__c> existingCoordinatorGroups = [
                SELECT Id,Name,State__c
                FROM Support_CoordinatorCatalogueGroup__c
                WHERE Support_Client__c = :participantId
            ];
    
            Map<Id,Support_CoordinatorCatalogueGroup__c> existingCoordinatorGroupMap = new Map<Id,Support_CoordinatorCatalogueGroup__c>(existingCoordinatorGroups);
            Set<Id> uiCoordinatorGroupIds = new Set<Id>();
            List<Support_CoordinatorCatalogueGroup__c> coordinatorGroupsToInsert = new List<Support_CoordinatorCatalogueGroup__c>();
            List<Support_CoordinatorCatalogueGroup__c> coordinatorGroupsToUpdate = new List<Support_CoordinatorCatalogueGroup__c>();
    
            if(coordinatorServiceGroups != null){
                for(Object obj : coordinatorServiceGroups){
                    Map<String,Object> coordinatorServiceGroup = (Map<String,Object>)obj;
                    Id groupId = (Id)coordinatorServiceGroup.get('id');
    
                    Support_CoordinatorCatalogueGroup__c sg;
    
                    if(groupId != null && existingCoordinatorGroupMap.containsKey(groupId)){
                        sg = existingCoordinatorGroupMap.get(groupId);
                        uiCoordinatorGroupIds.add(groupId);
                    }else{
                        sg = new Support_CoordinatorCatalogueGroup__c();
                        sg.Support_Client__c = participantId;
                    }
    
                    sg.Name = (String)coordinatorServiceGroup.get('serviceType');
                    sg.State__c = (String)coordinatorServiceGroup.get('state');
                    sg.BudgetAllocation__c = toDecimal(coordinatorServiceGroup.get('budgetAllocation'));
                    sg.AmountSpent__c = toDecimal(coordinatorServiceGroup.get('amountSpent'));
                    sg.Budget_Spent_to_Date__c = toDecimal(coordinatorServiceGroup.get('budgetSpentToDate'));
                    sg.Organization__c = orgId;
    
                    if(groupId != null){
                        coordinatorGroupsToUpdate.add(sg);
                    }else{
                        coordinatorGroupsToInsert.add(sg);
                    }
                }
    
                if(!coordinatorGroupsToInsert.isEmpty()){
                    insert coordinatorGroupsToInsert;
                }
    
                if(!coordinatorGroupsToUpdate.isEmpty()){
                    update coordinatorGroupsToUpdate;
                }
    
               /* List<Support_CoordinatorCatalogueGroup__c> coordinatorGroupsToDelete = new List<Support_CoordinatorCatalogueGroup__c>();
    
                for(Support_CoordinatorCatalogueGroup__c oldGroup : existingCoordinatorGroupMap.values()){
    
                    if(!uiCoordinatorGroupIds.contains(oldGroup.Id)){
                        coordinatorGroupsToDelete.add(oldGroup);
                    }
                }
                if(!coordinatorGroupsToDelete.isEmpty()){
                    delete coordinatorGroupsToDelete;
                }*/
            }
    
            Map<String,Id> coordinatorGroupMap = new Map<String,Id>();
    
            for(Support_CoordinatorCatalogueGroup__c sg : coordinatorGroupsToInsert){
                coordinatorGroupMap.put(sg.Name + '-' + sg.State__c,sg.Id);
            }
    
            for(Support_CoordinatorCatalogueGroup__c sg : coordinatorGroupsToUpdate){
                coordinatorGroupMap.put(sg.Name + '-' + sg.State__c,sg.Id);
            }
    
            List<Support_CoordinatorCatalogue__c> existingCoordinatorItems = [
                SELECT Id,Support_CoordinatorCatalogueGroup__c
                FROM Support_CoordinatorCatalogue__c
                WHERE Support_CoordinatorCatalogueGroup__c IN :existingCoordinatorGroupMap.keySet()
            ];
    
            Map<Id,Support_CoordinatorCatalogue__c> existingCoordinatorItemMap = new Map<Id,Support_CoordinatorCatalogue__c>(existingCoordinatorItems);
            Set<Id> uiCoordinatorItemIds = new Set<Id>();
            List<Support_CoordinatorCatalogue__c> coordinatorItemsToInsert = new List<Support_CoordinatorCatalogue__c>();
            List<Support_CoordinatorCatalogue__c> coordinatorItemsToUpdate = new List<Support_CoordinatorCatalogue__c>();
    
            if(coordinatorServiceGroups != null){
                for(Object obj : coordinatorServiceGroups){
                    Map<String,Object> coordinatorServiceGroup = (Map<String,Object>)obj;
                    List<Object> supportItems = (List<Object>)coordinatorServiceGroup.get('supportItems');
    
                    if(supportItems == null){
                        continue;
                    }
    
                    for(Object itemObj : supportItems){
                        Map<String,Object> item = (Map<String,Object>)itemObj;
                        Id itemId = (Id)item.get('id');
    
                        Support_CoordinatorCatalogue__c si;
    
                        if(itemId != null && existingCoordinatorItemMap.containsKey(itemId)){
                            si = existingCoordinatorItemMap.get(itemId);
                            uiCoordinatorItemIds.add(itemId);
                        }else{
                            si = new Support_CoordinatorCatalogue__c();
                        }
    
                        String groupKey = (String)coordinatorServiceGroup.get('serviceType') + '-' + (String)coordinatorServiceGroup.get('state');
    
                        si.Support_CoordinatorCatalogueGroup__c = coordinatorGroupMap.get(groupKey);
                        si.Support_Item_Name__c = (String)item.get('supportItemName');
                        si.Support_Item_Number__c = (String)item.get('supportItemNumber');
                        si.State__c = (String)item.get('state');
                        si.Amount__c = toDecimal(item.get('amount'));
                        si.IsActive__c = (Boolean)item.get('isActive');
    
                        if(itemId != null){
                            coordinatorItemsToUpdate.add(si);
                        }else{
                            coordinatorItemsToInsert.add(si);
                        }
                    }
                }
    
                if(!coordinatorItemsToInsert.isEmpty()){
                    insert coordinatorItemsToInsert;
                }
                if(!coordinatorItemsToUpdate.isEmpty()){
                    update coordinatorItemsToUpdate;
                }
    
               /* List<Support_CoordinatorCatalogue__c> coordinatorItemsToDelete = new List<Support_CoordinatorCatalogue__c>();
                for(Support_CoordinatorCatalogue__c oldItem : existingCoordinatorItemMap.values()){
                    if(!uiCoordinatorItemIds.contains(oldItem.Id)){
                        coordinatorItemsToDelete.add(oldItem);
                    }
                }
                if(!coordinatorItemsToDelete.isEmpty()){
                    delete coordinatorItemsToDelete;
                }*/
            }
            return participant.Id;
        }catch(Exception e){
            Database.rollback(sp);
            throw new AuraHandledException(e.getMessage());
        }
    }

    private static Decimal toDecimal(Object val){

        if(val == null){
            return null;
        }
    
        String strValue =
            String.valueOf(val).trim();
    
        if(String.isBlank(strValue)){
            return null;
        }
    
        return Decimal.valueOf(strValue);
    }

    @AuraEnabled
    public static List<Support_Client__c> getAllParticipants() {

        // Get logged-in user details
        User currentUser = [
            SELECT Id, Email, Organization_Name__c
            FROM User 
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
        System.debug('🔵 Current User: ' + currentUser);

        List<Organisation__c> organisationList = [
           SELECT Id, Name
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        // Find matching staff record
        /* List<Staff__c> staffList = [
            SELECT Id 
            FROM Staff__c 
            WHERE Email_Address__c = :currentUser.Email
            LIMIT 1
        ]; */

        // If no staff found, return empty list (avoid errors)
        if (organisationList.isEmpty()) {
            System.debug('⚠ No Organisation found. Returning empty list.');
            return new List<Support_Client__c>();
        }

        Id orgId = organisationList[0].Id;
        System.debug('🟢 Matched Staff Id: ' + orgId);

        // Return only the participants linked to this staff
        return [
            SELECT Id,
                Name,
                First_Name__c,
                Last_Name__c,
                Email__c,
                Phone__c,
                Emergency_Contact__c,
                NDIS_Number__c,
                Date_of_Birth__c,
                Plan_Start_Date__c,
                Plan_End_Date__c,
                Risk_Level__c,
                Support_Category__c,
                Total_Plan_Budget__c,
                Number_Of_Goals__c,
                SupportClient_To_Staff__c,
                Organization__c,
                Address__Street__s,
                Address__City__s,
                Address__StateCode__s,
                Address__PostalCode__s,
                Address__CountryCode__s,
                Is_Pinned__c,
                Support_Coordinator_Budget__c,
                Support_Coordinator_Spent_Budget__c,
                Budget_Spent_to_Date__c
            FROM Support_Client__c
            WHERE Organization__c = :orgId  AND Status__c = 'Active'
            ORDER BY Name ASC
        ];
    }
   /*
    @AuraEnabled
    public static Map<String, Object> getParticipantsPaged1(
        Integer pageSize,
        Integer pageNumber
    ) {
        Map<String, Object> response = new Map<String, Object>();

        try {
            if (pageSize == null || pageSize <= 0) pageSize = 10;
            if (pageNumber == null || pageNumber <= 0) pageNumber = 1;

            Integer offsetVal = (pageNumber - 1) * pageSize;
           // Boolean isPinned = participantType == 'pinned';

            //String searchLike = '%' + searchName + '%';

            User currentUser = [
                SELECT Id, Email, Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            

            Organisation__c organisationList = [
                SELECT Id, Name
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            if (organisationList == null) {
                response.put('records', new List<Support_Client__c>());
                response.put('totalCount', 0);
                response.put('totalPages', 0);
                response.put('status', 'SUCCESS');
                return response;
            }

            List<Support_Client__c> participants = [
                SELECT
                    Id, Name,First_Name__c,Last_Name__c, Email__c, Phone__c, Emergency_Contact__c,
                    NDIS_Number__c, Date_of_Birth__c,Classification__c,Provider_Budget__c,
                    Plan_Start_Date__c, Plan_End_Date__c,Support_Coordinator_Budget__c,
                    Risk_Level__c, Support_Category__c,Selected_Service_Types__c,Type_of_Industry__c,
                    Total_Plan_Budget__c, Number_Of_Goals__c,About_Participant__c,
                    SupportClient_To_Staff__c,Organization__c,
                    Address__Street__s, Address__City__s,
                    Address__StateCode__s, Address__PostalCode__s,
                    Address__CountryCode__s,
                    Is_Pinned__c, Budget_Spent_to_Date__c,Status__c,
                	 
                    // Child Support Notes 
                    (
                        SELECT
                            Id,
                            Name,
                            Case_Note_Content__c,
                            Notes_Type__c,
                            Billable__c,
                            CreatedDate,
                            OwnerId
                        FROM SupportNotes1__r
                    )
                FROM Support_Client__c
                WHERE Organization__c = :organisationList.Id
                ORDER BY Name
                LIMIT :pageSize
                OFFSET :offsetVal
            ];


            Integer totalCount = [
                SELECT COUNT()
                FROM Support_Client__c
                WHERE Organization__c = :organisationList.Id
            ];

            Integer totalPages =
                (Integer)Math.ceil((Decimal)totalCount / pageSize);

            response.put('records', participants);
            response.put('totalCount', totalCount);
            response.put('pageSize', pageSize);
            response.put('pageNumber', pageNumber);
            response.put('totalPages', totalPages);
            response.put('status', 'SUCCESS');
        }
        catch (Exception e) {
            response.put('status', 'ERROR');
            response.put('message', e.getMessage());
        }

        return response;
    }*/
    @AuraEnabled
public static Map<String, Object> getParticipantsPaged(
    Integer pageSize,
    Integer pageNumber,
    String searchName,
    String participantType
) {

    Map<String, Object> response =
        new Map<String, Object>();

    try {

        if (pageSize == null || pageSize <= 0) {
            pageSize = 10;
        }

        if (pageNumber == null || pageNumber <= 0) {
            pageNumber = 1;
        }

        Integer offsetVal =
            (pageNumber - 1) * pageSize;

        User currentUser = [

            SELECT
                Id,
                Email,
                Organization_Name__c

            FROM User

            WHERE Id = :UserInfo.getUserId()

            LIMIT 1
        ];

        List<Organisation__c> organisationList = [

            SELECT
                Id,
                Name

            FROM Organisation__c

            WHERE Name =
                :currentUser.Organization_Name__c

            LIMIT 1
        ];

        if (organisationList.isEmpty()) {

            response.put(
                'records',
                new List<Support_Client__c>()
            );

            response.put('totalCount', 0);

            response.put('totalPages', 0);

            response.put('status', 'SUCCESS');

            return response;
        }

        Id orgId = organisationList[0].Id;

        // =====================================================
        // WHERE CLAUSE
        // =====================================================

        String whereClause =
            ' WHERE Organization__c = :orgId ';

        // 🔹 Pinned filter
        if (participantType == 'pinned') {

            whereClause +=
                ' AND Is_Pinned__c = true ';
        }

        // 🔹 Search filter
        /*if (!String.isBlank(searchName)) {

            String searchLike =
                '%' +
                String.escapeSingleQuotes(searchName)
                + '%';

           whereClause +=
            ' AND (' +
                'Name LIKE :searchLike ' +
                'OR First_Name__c LIKE :searchLike ' +
                'OR Last_Name__c LIKE :searchLike ' +
            ') ';
        }*/
        if (!String.isBlank(searchName)) {

    String searchLike =
        '%' +
        String.escapeSingleQuotes(searchName)
        + '%';

    // ✅ Split full name
    String[] nameParts =
        searchName.split(' ');

    String firstPart =
        '%' +
        String.escapeSingleQuotes(
            nameParts[0]
        ) +
        '%';

    String secondPart =
        nameParts.size() > 1
        ? '%' +
            String.escapeSingleQuotes(
                nameParts[1]
            ) +
            '%'
        : firstPart;

    whereClause +=
        ' AND (' +

            // ✅ Full Name
            'Name LIKE :searchLike ' +

            // ✅ First Name
            'OR First_Name__c LIKE :searchLike ' +

            // ✅ Last Name
            'OR Last_Name__c LIKE :searchLike ' +

            // ✅ First + Last
            'OR (' +
                'First_Name__c LIKE :firstPart ' +
                'AND Last_Name__c LIKE :secondPart' +
            ')' +

        ') ';
}

        // =====================================================
        // MAIN QUERY
        // =====================================================

        String participantQuery =

            'SELECT ' +

            'Id, Name, First_Name__c, Last_Name__c, ' +
            'Email__c, Phone__c, Emergency_Contact__c, ' +
            'NDIS_Number__c, Date_of_Birth__c, ' +
            'Classification1__c, Provider_Budget__c, ' +
            'Plan_Start_Date__c, Plan_End_Date__c, ' +
            'Support_Coordinator_Budget__c, ' +
            'Risk_Level__c, Support_Category__c, ' +
            'Selected_Service_Types__c, Type_of_Industry__c, ' +
            'Total_Plan_Budget__c, Number_Of_Goals__c, ' +
            'About_Participant1__c, ' +
            'SupportClient_To_Staff__c, Organization__c, ' +
            'Address__Street__s, Address__City__s, ' +
            'Address__StateCode__s, Address__PostalCode__s, ' +
            'Address__CountryCode__s, ' +
            'Is_Pinned__c, Budget_Spent_to_Date__c, ' +
            'Status__c, ' +

            '(SELECT ' +
                'Id, Name, Case_Note_Content__c, ' +
                'Notes_Type__c, Billable__c, ' +
                'CreatedDate, OwnerId ' +
            'FROM SupportNotes1__r) ' +

            'FROM Support_Client__c ' +

            whereClause +

            ' ORDER BY Name ' +

            ' LIMIT :pageSize ' +

            ' OFFSET :offsetVal';

        List<Support_Client__c> participants =

            Database.query(participantQuery);

        // =====================================================
        // COUNT QUERY
        // =====================================================

        String countQuery =

            'SELECT COUNT() ' +
            'FROM Support_Client__c ' +

            whereClause;

        Integer totalCount =
            Database.countQuery(countQuery);

        Integer totalPages =

            (Integer)Math.ceil(
                (Decimal)totalCount / pageSize
            );

        // =====================================================
        // RESPONSE
        // =====================================================

        response.put('records', participants);

        response.put('totalCount', totalCount);

        response.put('pageSize', pageSize);

        response.put('pageNumber', pageNumber);

        response.put('totalPages', totalPages);

        response.put('status', 'SUCCESS');
    }

    catch (Exception e) {

        response.put('status', 'ERROR');

        response.put('message', e.getMessage());
    }

    return response;
}

    @AuraEnabled
    public static void updateParticipantPin(Id participantId, Boolean isPinned) {
        Support_Client__c sc = [
            SELECT Id, Is_Pinned__c
            FROM Support_Client__c
            WHERE Id = :participantId
            LIMIT 1
        ];

        sc.Is_Pinned__c = isPinned;
        update sc;
    }

    private static Decimal parseDecimal(Object val) {
        if (val == null) return null;

        if (val instanceof Decimal) return (Decimal) val;
        if (val instanceof Integer) return Decimal.valueOf((Integer) val);
        if (val instanceof Long) return Decimal.valueOf((Long) val);
        if (val instanceof String && String.isNotBlank((String) val)) {
            return Decimal.valueOf((String) val);
        }
        return null;
    }


    @AuraEnabled
    public static List<Support_Notes__c> getTasksByDateRange( Date startDate, Date endDate) {
        System.debug('================ getTasksByDateRange START ================');
        System.debug('📆 Start Date: ' + startDate);
        System.debug('📆 End Date: ' + endDate);

        try {
            /* ==========================================
            CURRENT USER
            ========================================== */
            User currentUser = [
                SELECT Id, Email, Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            System.debug('👤 Current User Id: ' + currentUser.Id);
            System.debug('📧 Current User Email: ' + currentUser.Email);
            System.debug(
                '🏢 Organization Name: ' +
                currentUser.Organization_Name__c
            );

            /* ==========================================
            ORGANISATION
            ========================================== */
            List<Organisation__c> orgList = [
                SELECT Id, Name
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            System.debug('🏢 Org List Size: ' + orgList.size());

            if (orgList.isEmpty()) {
                System.debug('❌ No Organisation found');

                throw new AuraHandledException(
                    'No Organisation record found for the logged-in user.'
                );
            }

            Id orgId = orgList[0].Id;

            System.debug('✅ Organisation Id: ' + orgId);

            /* ==========================================
            FETCH NOTES
            ========================================== */
            List<Support_Notes__c> notes = [
                SELECT
                    Id,
                    Name,
                    SupportClient_To_Notes__c,
                    SupportClient_To_Notes__r.Name,
                    SupportClient_To_Notes__r.First_Name__c,
                    SupportClient_To_Notes__r.Last_Name__c,
                    SupportClient_To_Notes__r.SupportClient_To_Staff__c,

                    Entry_Date__c,
                    Notes_Type__c,
                    Contact_Method__c,
                    Billable__c,
                    Duration_Hours__c,
                    Charge_Level__c,
                    Total_Cost__c,
                    Activity_Details__c,
                    Start_Time__c,

                    Service_Type__c,
                    Service_Type__r.Name,

                    SupportNotes_To_SupportCatalogue__c,
                    SupportNotes_To_SupportCatalogue__r.Support_Item_Name__c,

                    Created_From__c,
                    Organization__c
                FROM Support_Notes__c
                WHERE Organization__c = :orgId
                AND Created_From__c = 'Task'
                AND Entry_Date__c >= :startDate
                AND Entry_Date__c <= :endDate
                ORDER BY Entry_Date__c DESC
            ];

            System.debug('📦 Notes Count: ' + notes.size());

            for (Support_Notes__c note : notes) {
                System.debug('---------------- NOTE ----------------');
                System.debug('🆔 Note Id: ' + note.Id);
                System.debug('📝 Name: ' + note.Name);
                System.debug(
                    '👤 Participant: ' +
                    note.SupportClient_To_Notes__r?.Name
                );
                System.debug('📅 Entry Date: ' + note.Entry_Date__c);
                System.debug('📌 Note Type: ' + note.Notes_Type__c);
                System.debug('📞 Contact Method: ' + note.Contact_Method__c);
                System.debug('💰 Billable: ' + note.Billable__c);
                System.debug('⏱ Duration: ' + note.Duration_Hours__c);
                System.debug('💲 Charge Level: ' + note.Charge_Level__c);
                System.debug('💵 Total Cost: ' + note.Total_Cost__c);
                System.debug(
                    '🛠 Service Type: ' +
                    note.Service_Type__r?.Name
                );
                System.debug(
                    '📦 Service Item: ' +
                    note.SupportNotes_To_SupportCatalogue__r?.Support_Item_Name__c
                );
                System.debug(
                    '📄 Activity: ' + note.Activity_Details__c
                );
            }

            System.debug('================ getTasksByDateRange END ================');

            return notes;

        } catch (Exception e) {
            System.debug('❌ ERROR in getTasksByDateRange');
            System.debug('Message: ' + e.getMessage());
            System.debug('Line: ' + e.getLineNumber());

            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void updateTaskDate(Id taskId, Date newDate) {

        System.debug('🔄 Updating Task Date');
        System.debug('➡ TaskId: ' + taskId);
        System.debug('➡ New Date: ' + newDate);

        if (taskId == null || newDate == null) {
            throw new AuraHandledException('Task Id or Date is missing.');
        }

        Support_Notes__c task = [
            SELECT Id, Entry_Date__c
            FROM Support_Notes__c
            WHERE Id = :taskId
            LIMIT 1
        ];

        task.Entry_Date__c = newDate;

        update task;

        System.debug('✅ Task date updated successfully');
    }   

    @AuraEnabled
    public static void saveTimeEntry(String formJson, String fundingJson) {
        System.debug('📦 Form JSON => ' + formJson);
        System.debug('💰 Funding JSON => ' + fundingJson);

        /* =====================================================
        NULL CHECK INPUT JSON
        ===================================================== */
        if (String.isBlank(formJson)) {
            throw new AuraHandledException('Form data is missing.');
        }

        if (String.isBlank(fundingJson)) {
            throw new AuraHandledException('Funding data is missing.');
        }

        /* =====================================================
        CURRENT USER
        ===================================================== */
        User currentUser = [
            SELECT Id, Email, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        /* =====================================================
        ORGANISATION
        ===================================================== */
        List<Organisation__c> orgList = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = :currentUser.Organization_Name__c
            LIMIT 1
        ];

        if (orgList.isEmpty()) {
            throw new AuraHandledException(
                'No Organisation record found for the logged-in user.'
            );
        }

        Id organisationId = orgList[0].Id;

        /* =====================================================
        DESERIALIZE JSON
        ===================================================== */
        Map<String, Object> form =
            (Map<String, Object>) JSON.deserializeUntyped(formJson);

        Map<String, Object> funding =
            (Map<String, Object>) JSON.deserializeUntyped(fundingJson);

        if (form == null) {
            throw new AuraHandledException('Form payload is invalid.');
        }

        if (funding == null) {
            throw new AuraHandledException('Funding payload is invalid.');
        }

        /* =====================================================
        FORM VALUES
        ===================================================== */
        Id participantId =
            form.containsKey('participant') &&
            form.get('participant') != null &&
            !String.isBlank(String.valueOf(form.get('participant')))
            ? (Id) String.valueOf(form.get('participant'))
            : null;

        Boolean isBillable =
            form.containsKey('isBillable') &&
            form.get('isBillable') != null
            ? (Boolean) form.get('isBillable')
            : false;

        Date entryDate = null;
        if (
            form.containsKey('date') &&
            form.get('date') != null &&
            !String.isBlank(String.valueOf(form.get('date')))
        ) {
            entryDate = Date.valueOf(String.valueOf(form.get('date')));
        }

        String noteType =
            form.containsKey('noteType') && form.get('noteType') != null
            ? String.valueOf(form.get('noteType'))
            : null;

        String contactMethod =
            form.containsKey('contactMethod') && form.get('contactMethod') != null
            ? String.valueOf(form.get('contactMethod'))
            : null;

        String activity1 =
            form.containsKey('activity1') && form.get('activity1') != null
            ? String.valueOf(form.get('activity1'))
            : null;

        /* =====================================================
        DURATION
        ===================================================== */
        Decimal hours =
            form.containsKey('durationHours') &&
            form.get('durationHours') != null &&
            !String.isBlank(String.valueOf(form.get('durationHours')))
            ? Decimal.valueOf(String.valueOf(form.get('durationHours')))
            : 0;

        Decimal minutes =
            form.containsKey('durationMinutes') &&
            form.get('durationMinutes') != null &&
            !String.isBlank(String.valueOf(form.get('durationMinutes')))
            ? Decimal.valueOf(String.valueOf(form.get('durationMinutes')))
            : 0;

        Decimal duration = (hours + (minutes / 60)).setScale(2);

        /* =====================================================
        SERVICE VALUES
        ===================================================== */
        Id serviceTypeId =
            form.containsKey('serviceType') &&
            form.get('serviceType') != null &&
            !String.isBlank(String.valueOf(form.get('serviceType')))
            ? (Id) String.valueOf(form.get('serviceType'))
            : null;

        Id serviceItemId =
            form.containsKey('serviceItem') &&
            form.get('serviceItem') != null &&
            !String.isBlank(String.valueOf(form.get('serviceItem')))
            ? (Id) String.valueOf(form.get('serviceItem'))
            : null;

       Decimal editableRate =
            form.containsKey('editableRate') &&
            form.get('editableRate') != null
            ? Decimal.valueOf(
                String.valueOf(form.get('editableRate'))
            )
            : 0;

        /* =====================================================
        FUNDING VALUES
        ===================================================== */
        Decimal totalBudget =
            funding.containsKey('totalBudget') &&
            funding.get('totalBudget') != null
            ? Decimal.valueOf(String.valueOf(funding.get('totalBudget')))
            : 0;

        Decimal currentSpending =
            funding.containsKey('currentSpending') &&
            funding.get('currentSpending') != null
            ? Decimal.valueOf(String.valueOf(funding.get('currentSpending')))
            : 0;

        /* =====================================================
        SERVICE ITEM AMOUNT
        ===================================================== */
        Decimal serviceItemAmount = 0;

        if (serviceItemId != null) {
            List<Support_CoordinatorCatalogue__c> selectedItems = [
                SELECT Id, Amount__c
                FROM Support_CoordinatorCatalogue__c
                WHERE Id = :serviceItemId
                LIMIT 1
            ];

            if (!selectedItems.isEmpty()) {
                Decimal dbAmount =
                    selectedItems[0].Amount__c != null
                    ? selectedItems[0].Amount__c
                    : 0;

                // Use edited UI rate if available
                serviceItemAmount =
                    editableRate > 0
                    ? editableRate
                    : dbAmount;
            }
        }

        Decimal entryCost = (duration * serviceItemAmount).setScale(2);

        /* =====================================================
        BILLABLE VALIDATION
        ===================================================== */
        if (isBillable) {
            if (serviceTypeId == null) {
                throw new AuraHandledException(
                    'Please select a Service Type.'
                );
            }

            if (serviceItemId == null) {
                throw new AuraHandledException(
                    'Please select a Service Item.'
                );
            }

            List<Support_CoordinatorCatalogueGroup__c> groups = [
                SELECT Id, BudgetAllocation__c, AmountSpent__c
                FROM Support_CoordinatorCatalogueGroup__c
                WHERE Id = :serviceTypeId
                FOR UPDATE
            ];

            if (groups.isEmpty()) {
                throw new AuraHandledException(
                    'Selected service type not found.'
                );
            }

            Support_CoordinatorCatalogueGroup__c groupRecord = groups[0];

            Decimal currentSpent =
                groupRecord.AmountSpent__c != null
                ? groupRecord.AmountSpent__c
                : 0;

            Decimal budget =
                groupRecord.BudgetAllocation__c != null
                ? groupRecord.BudgetAllocation__c
                : 0;

            Decimal newSpent = currentSpent + entryCost;

            if (newSpent > budget) {
                throw new AuraHandledException(
                    'Budget exceeded for selected service type.'
                );
            }

            groupRecord.AmountSpent__c = newSpent;
            update groupRecord;
        }

        /* =====================================================
        CREATE NOTE
        ===================================================== */
        Support_Notes__c note = new Support_Notes__c();

        note.SupportClient_To_Notes__c = participantId;
        note.Organization__c = organisationId;
        note.Entry_Date__c = entryDate;
        note.Notes_Type__c = noteType;
        note.Contact_Method__c = contactMethod;
        note.Billable__c = isBillable;
        note.Support_CoordinatorCatalogueGroup__c = serviceTypeId;
        note.Created_From__c = 'Case';
        note.Support_CoordinatorCatalogue__c = serviceItemId;
        note.Activity_Details__c = activity1;

        if (isBillable) {
            note.Duration_Hours__c =
                duration > 0
                ? String.valueOf(duration)
                : null;

            note.Charge_Level__c =
                serviceItemAmount > 0
                ? String.valueOf(serviceItemAmount.setScale(2))
                : null;

            note.Total_Cost__c =
                entryCost > 0
                ? String.valueOf(entryCost)
                : null;
        }

        note.Total_Plan_Budget__c = totalBudget;
        note.Budget_Spent_To_Date__c = currentSpending;

        insert note;

        /* =====================================================
        UPDATE PARTICIPANT
        ===================================================== */
        if (isBillable && participantId != null) {
            List<Support_Client__c> participants = [
                SELECT Id, Support_Coordinator_Spent_Budget__c
                FROM Support_Client__c
                WHERE Id = :participantId
                LIMIT 1
            ];

            if (!participants.isEmpty()) {
                Support_Client__c participant = participants[0];

                Decimal existingSpent =
                    participant.Support_Coordinator_Spent_Budget__c != null
                    ? participant.Support_Coordinator_Spent_Budget__c
                    : 0;

                participant.Support_Coordinator_Spent_Budget__c =
                    existingSpent + entryCost;

                update participant;
            }
        }

        System.debug('✅ Support Note saved: ' + note.Id);
    }

    /* ---------- Wrapper ---------- */

    public class ParticipantCatalogueInput {
        @AuraEnabled public Id catalogueId { get; set; }
        @AuraEnabled public Decimal budgetAllocation { get; set; }
        @AuraEnabled public Decimal amountSpent { get; set; }
        @AuraEnabled public String state { get; set; }
        @AuraEnabled public Decimal amount { get; set; }
        @AuraEnabled public Id providerId { get; set; }
    }

    /* ---------- Fetch Current FY NDIS Catalogue ---------- */
    @AuraEnabled
    public static List<NDIS_Support_Catalogue__c> fetchParticipantNDISCatalogue(
        String serviceType,
        Date serviceDate
    ) {
        if (String.isBlank(serviceType)) {
            return new List<NDIS_Support_Catalogue__c>();
        }

        // Resolve service date (same pattern as Client Apex)
        Date sDate = serviceDate != null ? serviceDate : Date.today();

        Integer year = sDate.year();
        Integer fyStartYear =
            sDate < Date.newInstance(year, 7, 1) ? year - 1 : year;

        Date financialStartDate = Date.newInstance(fyStartYear, 7, 1);

        return [
            SELECT Id,
                Name,
                Support_Item_Name__c,
                Support_Item_Number__c,
                ACT__c, NSW__c, VIC__c, QLD__c,
                WA__c, SA__c, TAS__c, NT__c
            FROM NDIS_Support_Catalogue__c
            WHERE Name = :serviceType
            AND Start_Date__c = :financialStartDate
            ORDER BY Support_Item_Name__c
        ];
    }

    @AuraEnabled
    public static List<Support_Catalogue__c> fetchParticipantCatalogues( Id supportClientId, String serviceType, String state ) {
        if (supportClientId == null || String.isBlank(serviceType)) {
            return new List<Support_Catalogue__c>();
        }

        // Step 1: Fetch parent group
        List<Support_CatalogueGroup__c> groups = [
            SELECT Id
            FROM Support_CatalogueGroup__c
            WHERE SupportCatalogueGroup_To_SupportClient__c = :supportClientId
            AND Name = :serviceType
            LIMIT 1
        ];

        if (groups.isEmpty()) {
            return new List<Support_Catalogue__c>();
        }

        Id parentGroupId = groups[0].Id;

        // Step 2: Fetch child records
        return [
            SELECT Id,
                SupportCatalogue_To_NDISSupportCatalogue__c,
                IsActive__c,
                State__c,
                    (
                    SELECT
                        Id,
                        Support_Provider__c,
                        Support_Provider__r.Name
                    FROM Support_Child_Provider__r
                )
            FROM Support_Catalogue__c
            WHERE CatalogueGroup_To_SupportCatalogue__c = :parentGroupId
            AND State__c = :state
            
        ];
    }

    /* ---------- Save / Update Participant Catalogue ---------- */
    @AuraEnabled
    public static void saveParticipantCatalogues( Id supportClientId, List<ParticipantCatalogueInput> selectedItems, Boolean isEditMode) {
        if (supportClientId == null || selectedItems == null || selectedItems.isEmpty()) {
            throw new AuraHandledException('Invalid request data.');
        }
        Decimal budget = selectedItems[0].budgetAllocation;
        Decimal spent  = selectedItems[0].amountSpent;

        if (budget != null && spent != null && spent > budget) {
        throw new AuraHandledException(
            'Current amount spent cannot be greater than budget allocation.'
        );
        }

        Set<Id> selectedCatalogueIds = new Set<Id>();
        for (ParticipantCatalogueInput input : selectedItems) {
            if (input.catalogueId != null) {
                selectedCatalogueIds.add(input.catalogueId);
            }
        }

        if (selectedCatalogueIds.isEmpty()) {
            throw new AuraHandledException('No support items selected.');
        }

        List<NDIS_Support_Catalogue__c> ndisRecords = [
            SELECT Id, Name
            FROM NDIS_Support_Catalogue__c
            WHERE Id IN :selectedCatalogueIds
        ];

        if (ndisRecords.isEmpty()) {
            throw new AuraHandledException('Invalid support catalogue items.');
        }

        String serviceType = ndisRecords[0].Name;

        // ----------------------------------------------------
        // 1️⃣ Parent uniqueness = Service Type only
        // ----------------------------------------------------
        // 🔹 Get current user organisation
        User currentUser = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Id organisationId;

        // If user has organisation name, find Organisation__c record
        if (String.isNotBlank(currentUser.Organization_Name__c)) {

            List<Organisation__c> orgList = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            if (!orgList.isEmpty()) {
                organisationId = orgList[0].Id;
            }
        }
        List<Support_CatalogueGroup__c> existingGroups = [
            SELECT Id, Name, BudgetAllocation__c, AmountSpent__c, State__c
            FROM Support_CatalogueGroup__c
            WHERE SupportCatalogueGroup_To_SupportClient__c = :supportClientId
            AND Name = :serviceType
            AND Organization_To_Support_CatalogueGroup__c = :organisationId
            LIMIT 1
        ];

        Support_CatalogueGroup__c parentGroup;

        if (!existingGroups.isEmpty()) {

            if (!isEditMode) {
                throw new AuraHandledException(
                'This service type already exists for this participant.'
                );
            }

            parentGroup = existingGroups[0];

        } else {

        parentGroup = new Support_CatalogueGroup__c(
            Name = serviceType,
            SupportCatalogueGroup_To_SupportClient__c = supportClientId,
            Organization_To_Support_CatalogueGroup__c = organisationId
        
        );

            insert parentGroup;
        }

        // ----------------------------------------------------
        // 2️⃣ Update parent (store latest state for UI only)
        // ----------------------------------------------------

        parentGroup.BudgetAllocation__c = selectedItems[0].budgetAllocation;
        parentGroup.AmountSpent__c = selectedItems[0].amountSpent;
        parentGroup.State__c = selectedItems[0].state;
    
        update parentGroup;

        // ----------------------------------------------------
        // 3️⃣ Load existing children
        // ----------------------------------------------------

        List<Support_Catalogue__c> existingChildren = [
            SELECT Id,
                SupportCatalogue_To_NDISSupportCatalogue__c,
                State__c,
                IsActive__c,
                SupportCatlogue_To_SupportProvider__c
            FROM Support_Catalogue__c
            WHERE CatalogueGroup_To_SupportCatalogue__c = :parentGroup.Id
        ];

        // KEY = CatalogueId + '-' + State
        Map<String, Support_Catalogue__c> existingChildMap = new Map<String, Support_Catalogue__c>();

        for (Support_Catalogue__c rec : existingChildren) {
            String key = rec.SupportCatalogue_To_NDISSupportCatalogue__c
            + '-' + rec.State__c
            + '-' + rec.SupportCatlogue_To_SupportProvider__c;
            existingChildMap.put(key, rec);
        }

        List<Support_Catalogue__c> toInsert = new List<Support_Catalogue__c>();
        List<Support_Catalogue__c> toUpdate = new List<Support_Catalogue__c>();

        // ----------------------------------------------------
        // 4️⃣ Process selected items
        // ----------------------------------------------------

        for (ParticipantCatalogueInput input : selectedItems) {

            String inputKey = input.catalogueId
                    + '-' + input.state
                    + '-' + input.providerId;

            if (existingChildMap.containsKey(inputKey)) {

                // Already exists → just activate
                Support_Catalogue__c existing = existingChildMap.get(inputKey);
                existing.SupportCatlogue_To_SupportProvider__c = input.providerId;
                existing.IsActive__c = true;
                existing.Amount__c = input.amount;
                toUpdate.add(existing);

            } else {

                // New allocation → insert
                toInsert.add(new Support_Catalogue__c(
                CatalogueGroup_To_SupportCatalogue__c = parentGroup.Id,
                SupportCatalogue_To_NDISSupportCatalogue__c = input.catalogueId,
                SupportCatlogue_To_SupportProvider__c = input.providerId,  // 🔥 NEW
                State__c = input.state,
                Amount__c = input.amount,
                IsActive__c = true
            ));
            }
        }

        // ----------------------------------------------------
        // 5️⃣ Deactivate removed items (only for same state)
        // ----------------------------------------------------

        Set<String> selectedKeys = new Set<String>();
        for (ParticipantCatalogueInput input : selectedItems) {
        selectedKeys.add(
            input.catalogueId
            + '-' + input.state
            + '-' + input.providerId
            );
        }

        for (Support_Catalogue__c existing : existingChildren) {
        String existingKey =existing.SupportCatalogue_To_NDISSupportCatalogue__c + '-' + existing.State__c + '-' + existing.SupportCatlogue_To_SupportProvider__c;
            if (!selectedKeys.contains(existingKey)
                && existing.State__c == selectedItems[0].state) {

                existing.IsActive__c = false;
                toUpdate.add(existing);
            }
        }

        if (!toInsert.isEmpty()) insert toInsert;
        if (!toUpdate.isEmpty()) update toUpdate;
    }

    public class ParticipantServiceGroupWrapper {
        
        @AuraEnabled public String serviceType;

        @AuraEnabled public Decimal budgetAllocation;
        @AuraEnabled public Decimal amountSpent;
        @AuraEnabled public Decimal availableFunds;
        @AuraEnabled public String state;
        @AuraEnabled public List<SupportItemWrapper> supportItems;
    }

    public class SupportItemWrapper {
        @AuraEnabled public Id recordId;
        @AuraEnabled public String supportItemName;
        @AuraEnabled public String supportItemNumber;
        @AuraEnabled public Decimal amount;
        @AuraEnabled public String state;
        @AuraEnabled public Id providerId;        
        @AuraEnabled public String providerName; 
    }

    @AuraEnabled
    public static List<ParticipantServiceGroupWrapper> fetchParticipantServiceGroups( Id supportClientId) {
        if (supportClientId == null) {
            return new List<ParticipantServiceGroupWrapper>();
        }

        // ------------------------------------------------------------
        // 1️⃣ Get Logged-in User Organisation
        // ------------------------------------------------------------

        User currentUser = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Id organisationId;

        if (String.isNotBlank(currentUser.Organization_Name__c)) {

            List<Organisation__c> orgList = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            if (!orgList.isEmpty()) {
                organisationId = orgList[0].Id;
            }
        }

        // If organisation not found → return empty (security-safe)
        if (organisationId == null) {
            return new List<ParticipantServiceGroupWrapper>();
        }

        // ------------------------------------------------------------
        // 2️⃣ Fetch Parent Groups (Filtered by Organisation)
        // ------------------------------------------------------------

        List<Support_CatalogueGroup__c> groups = [
            SELECT Id,
                Name,
                BudgetAllocation__c,
                AmountSpent__c,
                State__c,
                Organization_To_Support_CatalogueGroup__c
            FROM Support_CatalogueGroup__c
            WHERE SupportCatalogueGroup_To_SupportClient__c = :supportClientId
            AND Organization_To_Support_CatalogueGroup__c = :organisationId
        ];

        if (groups.isEmpty()) {
            return new List<ParticipantServiceGroupWrapper>();
        }

        Set<Id> groupIds = new Set<Id>();
        for (Support_CatalogueGroup__c g : groups) {
            groupIds.add(g.Id);
        }

        // ------------------------------------------------------------
        // 3️⃣ Fetch Child Records (Use Stored Amount + State)
        // ------------------------------------------------------------

        List<Support_Catalogue__c> children = [
            SELECT Id,
                    CatalogueGroup_To_SupportCatalogue__c,
                    SupportCatalogue_To_NDISSupportCatalogue__r.Support_Item_Name__c,
                    SupportCatalogue_To_NDISSupportCatalogue__r.Support_Item_Number__c,
                    SupportCatlogue_To_SupportProvider__c,
                    SupportCatlogue_To_SupportProvider__r.Name,
                State__c,
                Amount__c
            FROM Support_Catalogue__c
            WHERE CatalogueGroup_To_SupportCatalogue__c IN :groupIds
            AND IsActive__c = true
        ];

        Map<Id, List<SupportItemWrapper>> childMap =
            new Map<Id, List<SupportItemWrapper>>();

        for (Support_Catalogue__c child : children) {

            if (!childMap.containsKey(child.CatalogueGroup_To_SupportCatalogue__c)) {
                childMap.put(
                    child.CatalogueGroup_To_SupportCatalogue__c,
                    new List<SupportItemWrapper>()
                );
            }

            SupportItemWrapper item = new SupportItemWrapper();
            item.recordId = child.Id;
            item.supportItemName =
                child.SupportCatalogue_To_NDISSupportCatalogue__r.Support_Item_Name__c;
            item.supportItemNumber =
                child.SupportCatalogue_To_NDISSupportCatalogue__r.Support_Item_Number__c;
            item.providerId = child.SupportCatlogue_To_SupportProvider__c;
            item.providerName =
                child.SupportCatlogue_To_SupportProvider__r != null
                ? child.SupportCatlogue_To_SupportProvider__r.Name
                : null;    

            // 🔥 IMPORTANT: Use stored Amount__c
            item.amount = child.Amount__c;

            // Include state per child
            item.state = child.State__c;

            childMap
                .get(child.CatalogueGroup_To_SupportCatalogue__c)
                .add(item);
        }

        // ------------------------------------------------------------
        // 4️⃣ Build Wrapper Response
        // ------------------------------------------------------------

        List<ParticipantServiceGroupWrapper> result =
            new List<ParticipantServiceGroupWrapper>();

        for (Support_CatalogueGroup__c g : groups) {

            ParticipantServiceGroupWrapper wrapper =
                new ParticipantServiceGroupWrapper();

            wrapper.serviceType = g.Name;
            wrapper.state = g.State__c; // latest selected state (UI default)
            wrapper.budgetAllocation = g.BudgetAllocation__c;
            wrapper.amountSpent = g.AmountSpent__c;
            wrapper.availableFunds =
                (g.BudgetAllocation__c != null && g.AmountSpent__c != null)
                ? g.BudgetAllocation__c - g.AmountSpent__c
                : 0;

            wrapper.supportItems = childMap.containsKey(g.Id)
                ? childMap.get(g.Id)
                : new List<SupportItemWrapper>();

            result.add(wrapper);
        }

        return result;
    }

    @AuraEnabled
    public static List<String> fetchServiceTypes() {

        List<AggregateResult> results = [
            SELECT Name
            FROM NDIS_Support_Catalogue__c
            GROUP BY Name
            ORDER BY Name
        ];

        List<String> serviceTypes = new List<String>();

        for (AggregateResult ar : results) {
            serviceTypes.add((String) ar.get('Name'));
        }

        return serviceTypes;
    }

    // Support Category & Service Management ends here

    //Manual Entry code starts here
    public class SupportEntryWrapper {
        @AuraEnabled public Id recordId;
        @AuraEnabled public String referenceNumber;
        @AuraEnabled public Date serviceDate;
        @AuraEnabled public String participantName;
        @AuraEnabled public Id participantId;
        @AuraEnabled public String providerName;
        @AuraEnabled public Id providerId;
        @AuraEnabled public String serviceType;
        @AuraEnabled public String supportItemName;
        @AuraEnabled public Decimal hours;
        @AuraEnabled public Decimal rate;
        @AuraEnabled public Decimal totalAmount;
        @AuraEnabled public String claimStatus;
        @AuraEnabled public String dataSource;
    }

    @AuraEnabled
    public static Map<String, Object> getSupportEntriesPaged( Integer pageSize, Integer pageNumber) {
        Map<String, Object> response = new Map<String, Object>();

        try {

            if (pageSize == null || pageSize <= 0) pageSize = 10;
            if (pageNumber == null || pageNumber <= 0) pageNumber = 1;

            Integer offsetVal = (pageNumber - 1) * pageSize;

            // 🔐 Current Staff
            User currentUser = [
                SELECT Id, Email
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            Staff__c staff = [
                SELECT Id
                FROM Staff__c
                WHERE Email_Address__c = :currentUser.Email
                LIMIT 1
            ];

            // 📦 Fetch Entries
            List<Support_Entry__c> entries = [
                SELECT Id,
                    Name,
                    ServiceDate__c,
                    Hours__c,
                    Amount__c,
                    Total_Amount__c,
                    ClaimStatus__c,
                    DataSource__c,
                    ServiceType__c,
                    SupportItem_Name__c,
                    SupportEntry_To_SupportClient__c,
                    SupportEntry_To_SupportClient__r.Name,
                    SupportEntry_To_SupportProvider__c,
                    SupportEntry_To_SupportProvider__r.Name
                FROM Support_Entry__c
                WHERE SupportEntry_To_SupportClient__r.SupportClient_To_Staff__c = :staff.Id
                ORDER BY CreatedDate DESC
                LIMIT :pageSize
                OFFSET :offsetVal
            ];

            // 📊 Total Count
            Integer totalCount = [
                SELECT COUNT()
                FROM Support_Entry__c
                WHERE SupportEntry_To_SupportClient__r.SupportClient_To_Staff__c = :staff.Id
            ];

            Integer totalPages =
                (Integer)Math.ceil((Decimal)totalCount / pageSize);

            // 🧱 Wrapper Conversion
            List<SupportEntryWrapper> wrapped = new List<SupportEntryWrapper>();

            for (Support_Entry__c e : entries) {

                SupportEntryWrapper w = new SupportEntryWrapper();
                w.recordId = e.Id;
                w.referenceNumber = e.Name;
                w.serviceDate = e.ServiceDate__c;
                w.participantId = e.SupportEntry_To_SupportClient__c;
                w.participantName = e.SupportEntry_To_SupportClient__r.Name;
                w.providerId = e.SupportEntry_To_SupportProvider__c;
                w.providerName = e.SupportEntry_To_SupportProvider__r != null
                    ? e.SupportEntry_To_SupportProvider__r.Name
                    : null;
                w.serviceType = e.ServiceType__c;
                w.supportItemName = e.SupportItem_Name__c;
                w.hours = e.Hours__c;
                w.rate = e.Amount__c;
                w.totalAmount = e.Total_Amount__c;
                w.claimStatus = e.ClaimStatus__c;
                w.dataSource = e.DataSource__c;

                wrapped.add(w);
            }

            response.put('records', wrapped);
            response.put('totalCount', totalCount);
            response.put('pageSize', pageSize);
            response.put('pageNumber', pageNumber);
            response.put('totalPages', totalPages);
            response.put('status', 'SUCCESS');
        }
        catch (Exception e) {
            response.put('status', 'ERROR');
            response.put('message', e.getMessage());
        }

        return response;
    }

    @AuraEnabled
    public static Id saveSupportEntry(
        Id recordId,
        Id participantId,
        Id providerId,
        String serviceType,
        String supportItemName,
        String supportItemNumber, 
        Date serviceDate,
        Decimal hours,
        Decimal rate,
        String claimStatus,
        String dataSource,
        String notes
    ) {

        if (participantId == null || serviceDate == null || hours == null) {
            throw new AuraHandledException('Missing required fields.');
        }

        Support_Entry__c entry;

        if (recordId != null) {
            entry = [
                SELECT Id
                FROM Support_Entry__c
                WHERE Id = :recordId
                LIMIT 1
            ];
        } else {
            entry = new Support_Entry__c();
        }

        entry.SupportEntry_To_SupportClient__c = participantId;
        entry.SupportEntry_To_SupportProvider__c = providerId;
        entry.ServiceType__c = serviceType;
        entry.SupportItem_Name__c = supportItemName;
        entry.Support_Item_Number__c = supportItemNumber;
        entry.ServiceDate__c = serviceDate;
        entry.Hours__c = hours;
        entry.Amount__c = rate;
        entry.Total_Amount__c = hours * rate;
        entry.ClaimStatus__c = claimStatus;
        entry.DataSource__c = dataSource;
        entry.Notes__c = notes;

        if (recordId != null) {
            update entry;
        } else {
            insert entry;
        }

        return entry.Id;
    }

    @AuraEnabled
    public static List<Support_Client__c> fetchParticipantsForEntry() {

        User currentUser = [
            SELECT Id, Email
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            WHERE Email_Address__c = :currentUser.Email
            LIMIT 1
        ];

        return [
            SELECT Id, Name
            FROM Support_Client__c
            WHERE SupportClient_To_Staff__c = :staff.Id
            ORDER BY Name
        ];
    }

    @AuraEnabled
    public static List<String> fetchServiceTypesByParticipant(Id participantId) {

        if (participantId == null) return new List<String>();

        List<Support_CatalogueGroup__c> groups = [
            SELECT Name
            FROM Support_CatalogueGroup__c
            WHERE SupportCatalogueGroup_To_SupportClient__c = :participantId
        ];

        List<String> result = new List<String>();

        for (Support_CatalogueGroup__c g : groups) {
            result.add(g.Name);
        }

        return result;
    }

    @AuraEnabled(cacheable=true)
    public static List<Support_Catalogue__c> fetchSupportItemsForEntry( Id participantId, String serviceType) {
        if (participantId == null || String.isBlank(serviceType))
            return new List<Support_Catalogue__c>();

        Support_CatalogueGroup__c Catgroup = [
            SELECT Id
            FROM Support_CatalogueGroup__c
            WHERE SupportCatalogueGroup_To_SupportClient__c = :participantId
            AND Name = :serviceType
            LIMIT 1
        ];

        return [
            SELECT Id,
                Amount__c,
                SupportCatalogue_To_NDISSupportCatalogue__r.Support_Item_Name__c,
                SupportCatalogue_To_NDISSupportCatalogue__r.Support_Item_Number__c,
                SupportCatlogue_To_SupportProvider__c,
                SupportCatlogue_To_SupportProvider__r.Name
            FROM Support_Catalogue__c
            WHERE CatalogueGroup_To_SupportCatalogue__c = :Catgroup.Id
            AND IsActive__c = true
        ];
    }

    //manual entry code ends here
    @AuraEnabled
    public static List<Support_Catalogue__c> fetchSupportItemsForNotes(Id participantId) {

        if (participantId == null) {
            return new List<Support_Catalogue__c>();
        }

        return [
            SELECT Id,
                SupportCatalogue_To_NDISSupportCatalogue__r.Support_Item_Name__c,
                SupportCatalogue_To_NDISSupportCatalogue__r.Support_Item_Number__c
            FROM Support_Catalogue__c
            WHERE CatalogueGroup_To_SupportCatalogue__r.SupportCatalogueGroup_To_SupportClient__c = :participantId
            AND CatalogueGroup_To_SupportCatalogue__r.Name = 'Support Coordination'
            AND IsActive__c = true
            ORDER BY SupportCatalogue_To_NDISSupportCatalogue__r.Support_Item_Name__c
        ];
    }


    @AuraEnabled
    public static Map<String, Object> getParticipantsPagedforNotes( Integer pageSize, Integer pageNumber, String participantType ) {
        Map<String, Object> response = new Map<String, Object>();

        try {
            if (pageSize == null || pageSize <= 0) {
                pageSize = 10;
            }

            if (pageNumber == null || pageNumber <= 0) {
                pageNumber = 1;
            }

            Integer offsetVal = (pageNumber - 1) * pageSize;

            User currentUser = [
                SELECT Id, Email, Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            List<Organisation__c> organisationList = [
                SELECT Id, Name
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            if (organisationList == null || organisationList.isEmpty()) {
                response.put('records', new List<Map<String, Object>>());
                response.put('totalCount', 0);
                response.put('pageSize', pageSize);
                response.put('pageNumber', pageNumber);
                response.put('totalPages', 0);
                response.put('status', 'SUCCESS');
                return response;
            }

            Id orgId = organisationList[0].Id;

            String pinnedCondition = '';

            if (participantType == 'pinned') {
                pinnedCondition = ' AND Is_Pinned__c = true';
            }

            String query =
                'SELECT ' +
                    'Id, ' +
                    'Name, ' +
                    'First_Name__c, ' +
                    'Last_Name__c, ' +
                    'Email__c, ' +
                    'Phone__c, ' +
                    'NDIS_Number__c, Plan_Start_Date__c, Plan_End_Date__c, Provider_Budget__c,  Provider_Spent_Budget__c, Total_Plan_Budget__c, ' +
                    'Status__c, ' +
                    'Is_Pinned__c, ' +
                    'Support_Coordinator_Budget__c, ' +
                    'Support_Coordinator_Spent_Budget__c, ' +

                    // CASE NOTES
                    '(' +
                        'SELECT ' +
                            'Id, ' +
                            'Name, ' +
                            'Entry_Date__c, ' +
                            'Notes_Type__c, ' +
                            'Contact_Method__c, ' +
                            'Billable__c, ' +
                            'Duration_Hours__c, ' +
                            'Charge_Level__c, ' +
                            'Total_Cost__c, ' +
                            'Activity_Details__c, ' +
                            'Support_CoordinatorCatalogueGroup__r.Name, ' +
                            'Support_CoordinatorCatalogue__r.Support_Item_Name__c, ' +
                            'CreatedDate, ' +
                            'OwnerId ' +
                        'FROM SupportNotes1__r ' +
                        'WHERE Created_From__c = \'Case\' ' +
                        'ORDER BY CreatedDate DESC' + 
                    '), ' +

                    // SUPPORT GROUPS
                    '(' +
                        'SELECT ' +
                            'Id, ' +
                            'Name, ' +
                            '(' +
                                'SELECT ' +
                                    'Id, ' +
                                    'Name, ' +
                                    'Amount__c, ' +
                                    'Support_Item_Name__c, ' +
                                    'Support_Item_Number__c ' +
                                'FROM Support_CoordinatorCatalogue__r' +
                            ') ' +
                        'FROM Support_CoordinatorCatalogueGroup__r' +
                    ') ' +

                'FROM Support_Client__c ' +
                'WHERE Organization__c = :orgId ' +
                pinnedCondition +
                ' ORDER BY Name ' +
                'LIMIT :pageSize ' +
                'OFFSET :offsetVal';

            System.debug('QUERY => ' + query);

            List<Support_Client__c> participants = Database.query(query);

            List<Map<String, Object>> participantData =
                new List<Map<String, Object>>();

            for (Support_Client__c participant : participants) {
                Map<String, Object> row = new Map<String, Object>();

                row.put('Id', participant.Id);
                row.put('Name', participant.Name);
                row.put('First_Name__c', participant.First_Name__c);
                row.put('Last_Name__c', participant.Last_Name__c);
                row.put('Email__c', participant.Email__c);
                row.put('Phone__c', participant.Phone__c);
                row.put('NDIS_Number__c', participant.NDIS_Number__c);
                row.put('Status__c', participant.Status__c);
                row.put('Is_Pinned__c', participant.Is_Pinned__c);
                row.put('Plan_Start_Date__c', participant.Plan_Start_Date__c);
                row.put('Plan_End_Date__c', participant.Plan_End_Date__c);
                row.put('Provider_Budget__c', participant.Provider_Budget__c);
                row.put('Provider_Spent_Budget__c', participant.Provider_Spent_Budget__c);
                row.put('Provider_Spent_Budget__c', participant.Provider_Spent_Budget__c);
                row.put('Support_Coordinator_Budget__c', participant.Support_Coordinator_Budget__c);
                row.put('Support_Coordinator_Spent_Budget__c', participant.Support_Coordinator_Spent_Budget__c);
                row.put('TotalPlanBudget__c', participant.Total_Plan_Budget__c);

                row.put(
                    'Total_Plan_Budget__c',
                    participant.Support_Coordinator_Budget__c
                );

                row.put(
                    'Budget_Spent_to_Date__c',
                    participant.Support_Coordinator_Spent_Budget__c
                );

                row.put(
                    'caseNoteCount',
                    participant.SupportNotes1__r != null
                        ? participant.SupportNotes1__r.size()
                        : 0
                );

                row.put(
                    'caseNotes',
                    participant.SupportNotes1__r != null
                        ? participant.SupportNotes1__r
                        : new List<Support_Notes__c>()
                );

                row.put(
                    'supportCatalogueGroups',
                    participant.Support_CoordinatorCatalogueGroup__r  != null
                        ? participant.Support_CoordinatorCatalogueGroup__r 
                        : new List<Support_CoordinatorCatalogueGroup__c>()
                );

                participantData.add(row);
            }

            String countQuery =
                'SELECT COUNT() ' +
                'FROM Support_Client__c ' +
                'WHERE Organization__c = :orgId ' +
                pinnedCondition;

            Integer totalCount = Database.countQuery(countQuery);

            Integer totalPages =
                (Integer)Math.ceil((Decimal)totalCount / pageSize);

            response.put('records', participantData);
            response.put('totalCount', totalCount);
            response.put('pageSize', pageSize);
            response.put('pageNumber', pageNumber);
            response.put('totalPages', totalPages);
            response.put('status', 'SUCCESS');

        } catch (Exception e) {
            response.put('status', 'ERROR');
            response.put('message', e.getMessage());
            System.debug('ERROR => ' + e.getMessage());
        }

        return response;
    }
    
    /*
    @AuraEnabled(cacheable=false)
    public static List<Id> createUpdatepdateParticipantContacts( Id clientId, String contactData ){
    
        System.debug('▶️ Entering updateParticipantContacts');
        System.debug('clientId => ' + clientId);
        System.debug('contactData => ' + contactData);
    
        List<Object> rawList = (List<Object>)JSON.deserializeUntyped(contactData);
    
        List<Map<String,Object>> contactRows = new List<Map<String,Object>>();
    
        for(Object obj : rawList){
    
            contactRows.add((Map<String,Object>)obj);
        }
    
        List<Support_Client_Contact__c> contactsToUpsert = new List<Support_Client_Contact__c>();
    
        List<Map<String,Object>> validRows = new List<Map<String,Object>>();
    
        for(Map<String,Object> row : contactRows){
    
            System.debug('Processing Row => ' + row);
    
            if(row.get('contactType') != null && row.get('contactType') != ''){
    
                Support_Client_Contact__c con = new Support_Client_Contact__c();
    
                String contactId;
    
                if(row.containsKey('id') && row.get('id') != null){
    
                    contactId = String.valueOf(row.get('id'));
    
                } else if(row.containsKey('Id') && row.get('Id') != null){
    
                    contactId = String.valueOf(row.get('Id'));
                }
    
                if(contactId != null && (contactId.length() == 15 || contactId.length() == 18)){
    
                    con.Id = contactId;
    
                    System.debug('Existing Contact => ' + con.Id);
    
                } else {
    
                    System.debug('New Contact Row');
                }
    
                con.Support_Client__c = clientId;
                con.Contact_Type__c = (String)row.get('contactType');
                con.First_Name__c = (String)row.get('firstName');
                con.Last_Name__c = (String)row.get('lastName');
                con.Contact_Number__c = (String)row.get('contactNumber');
                con.Email__c = (String)row.get('email');
                con.Notify__c = (Boolean)row.get('notify');
    
                System.debug('Prepared Contact => ' + con);
    
                contactsToUpsert.add(con);
    
                validRows.add(row);
    
            } else {
    
                System.debug('Skipped Row => Missing contactType');
            }
        }
    
        System.debug('contactsToUpsert => ' + contactsToUpsert);
    
        if(!contactsToUpsert.isEmpty()){
    
            upsert contactsToUpsert;
    
            System.debug('Contacts Upserted Successfully');
    
            List<Id> savedContactIds = new List<Id>();
    
            for(Support_Client_Contact__c con : contactsToUpsert){
    
                savedContactIds.add(con.Id);
            }
    
            System.debug('savedContactIds => ' + savedContactIds);
    
            List<Support_Client_Contact_Attachment__c> attachmentsToInsert =
                new List<Support_Client_Contact_Attachment__c>();
    
            for(Integer i = 0; i < contactsToUpsert.size(); i++){
    
                Support_Client_Contact__c savedContact = contactsToUpsert[i];
    
                Map<String,Object> row = validRows[i];
    
                System.debug('Processing Attachments For => ' + savedContact.Id);
    
                if(row.containsKey('uploadedFiles') && row.get('uploadedFiles') != null){
    
                    List<Object> uploadedFiles = (List<Object>)row.get('uploadedFiles');
    
                    for(Object fileObj : uploadedFiles){
    
                        Map<String,Object> fileMap = (Map<String,Object>)fileObj;
    
                        if(fileMap.containsKey('attachmentId') && fileMap.get('attachmentId') != null){
    
                            System.debug('Existing Attachment Skipped');
    
                            continue;
                        }
    
                        Support_Client_Contact_Attachment__c fileRec =
                            new Support_Client_Contact_Attachment__c();
    
                        fileRec.Support_Client_Contact__c = savedContact.Id;
                        fileRec.File_Name__c = (String)fileMap.get('originalName');
                        fileRec.Amazon_File_URL__c = (String)fileMap.get('url');
                        fileRec.Key__c = (String)fileMap.get('key');
                        fileRec.Size__c = String.valueOf(fileMap.get('size'));
                        fileRec.Added_By__c = clientId;
    
                        attachmentsToInsert.add(fileRec);
    
                        System.debug('Prepared Attachment => ' + fileRec);
                    }
                }
            }
    
            if(!attachmentsToInsert.isEmpty()){
    
                insert attachmentsToInsert;
    
                System.debug('Attachments Inserted Successfully');
    
            } else {
    
                System.debug('No New Attachments');
            }
    
            return savedContactIds;
        }
    
        System.debug('No Contacts To Upsert');
    
        return new List<Id>();
    }
        */

    @AuraEnabled(cacheable=false)
public static List<Id> createUpdatepdateParticipantContacts(
    Id clientId,
    String contactData
) {

    System.debug('▶️ Entering createUpdatepdateParticipantContacts');
    System.debug('🟦 clientId: ' + clientId);
    System.debug('🟦 raw contactData JSON: ' + contactData);

    List<Object> rawList =
        (List<Object>) JSON.deserializeUntyped(contactData);

    System.debug('🟩 Parsed JSON (rawList): ' + rawList);

    List<Map<String, Object>> contactRows =
        new List<Map<String, Object>>();

    for (Object obj : rawList) {

        contactRows.add(
            (Map<String, Object>) obj
        );
    }

    System.debug(
        '🟩 contactRows after casting: ' +
        contactRows
    );

    List<Support_Client_Contact__c> contactsToUpsert =
        new List<Support_Client_Contact__c>();

    // ========================================
    // VALID ROWS
    // ========================================

    List<Map<String, Object>> validRows =
        new List<Map<String, Object>>();

    for (Map<String, Object> row : contactRows) {

        System.debug('🔹 Processing row: ' + row);

        if (
            row.get('contactType') != null &&
            row.get('contactType') != ''
        ) {

            Support_Client_Contact__c con =
                new Support_Client_Contact__c();

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

                con.Id = contactId;

                System.debug(
                    '✳️ Existing record detected — Id assigned: ' +
                    con.Id
                );

            } else {

                System.debug(
                    '🆕 New record (no Id provided)'
                );
            }

            // ========================================
            // FIELD MAPPING
            // ========================================

            con.Support_Client__c =
                clientId;

            con.Contact_Type__c =
                (String) row.get('contactType');

            con.First_Name__c =
                (String) row.get('firstName');

            con.Last_Name__c =
                (String) row.get('lastName');

            con.Contact_Number__c =
                (String) row.get('contactNumber');

            con.Email__c =
                (String) row.get('email');

            con.Notify__c =
                (Boolean) row.get('notify');

            System.debug(
                '➡️ Prepared Support_Client_Contact__c record: ' +
                con
            );

            contactsToUpsert.add(con);

            validRows.add(row);

        } else {

            System.debug(
                '⚠️ Skipped row (missing contactType): ' +
                row
            );
        }
    }

    System.debug(
        '🟧 Final contactsToUpsert: ' +
        contactsToUpsert
    );

    // ========================================
    // UPSERT CONTACTS
    // ========================================

    if (!contactsToUpsert.isEmpty()) {

        System.debug(
            '🚀 Performing UPSERT on ' +
            contactsToUpsert.size() +
            ' records...'
        );

        upsert contactsToUpsert;

        System.debug(
            '✅ Upsert completed successfully.'
        );

        // ========================================
        // STORE SAVED IDS
        // ========================================

        List<Id> savedContactIds =
            new List<Id>();

        for (
            Support_Client_Contact__c con :
            contactsToUpsert
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

        List<Support_Client_Contact_Attachment__c>
            attachmentsToInsert =
                new List<Support_Client_Contact_Attachment__c>();

        for (
            Integer i = 0;
            i < contactsToUpsert.size();
            i++
        ) {

            Support_Client_Contact__c savedContact =
                contactsToUpsert[i];

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

                    Support_Client_Contact_Attachment__c fileRec =
                        new Support_Client_Contact_Attachment__c();

                    fileRec.Support_Client_Contact__c =
                        savedContact.Id;

                    fileRec.File_Name__c =
                        (String) fileMap.get('originalName');

                    fileRec.Name =
                        (String) fileMap.get('attachmentName');

                    fileRec.Amazon_file_URL__c =
                        (String) fileMap.get('url');

                    fileRec.Key__c =
                        (String) fileMap.get('key');

                    fileRec.Size__c =
                        String.valueOf(fileMap.get('size'));

                   fileRec.Type__c =
                    (String) fileMap.get('type');

                    fileRec.Comments__c =
                        (String) fileMap.get('comments');

                    fileRec.Other_Comments__c =
                        (String) fileMap.get('otherComments');

                    // ========================================
                    // EXPIRY DATE
                    // ========================================

                    Object expiryDateObj =
                        fileMap.get('expiryDate');

                    if (expiryDateObj != null) {
                         String expiryDate =
                            String.valueOf(expiryDateObj).trim();

                       // fileRec.Expiry_Date__c =
                          //  Date.valueOf(
                           //     String.valueOf(expiryDateObj)
                          //  );
                           if (!String.isBlank(expiryDate)) {

                            try {

                                // Expected format:
                                // yyyy-MM-dd

                                fileRec.Expiry_Date__c =
                                     Date.valueOf(expiryDate);

                                System.debug(
                                    '✅ Expiry Date Saved: ' +
                                    fileRec.Expiry_Date__c
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

                    // ========================================
                    // ADDED BY USER
                    // ========================================

                    if (fileMap.get('userId') != null) {

                        fileRec.User__c =
                            (Id) fileMap.get('userId');
                    }
                     fileRec.Added_By__c =clientId;
                    

                    attachmentsToInsert.add(fileRec);

                    System.debug(
                        '📄 New Attachment Prepared: ' +
                        fileRec
                    );
                }
            }
        }

        // ========================================
        // INSERT ATTACHMENTS
        // ========================================

        if (!attachmentsToInsert.isEmpty()) {

            System.debug(
                '🚀 Inserting Attachments: ' +
                attachmentsToInsert.size()
            );

            insert attachmentsToInsert;

            System.debug(
                '✅ Attachments inserted successfully'
            );

        } else {

            System.debug(
                '⚠️ No new attachments to insert.'
            );
        }

        System.debug(
            '🏁 Exiting createUpdatepdateParticipantContacts'
        );

        return savedContactIds;
    }

    System.debug('⚠️ No records to upsert.');

    return new List<Id>();
} 
    
    @AuraEnabled
    public static Support_Client__c getParticipantDetails( Id participantId ){
    
        List<Support_Client__c> participantDetails = [
    
            SELECT
                Id, Name, First_Name__c, Last_Name__c, Email__c, Phone__c,
                Emergency_Contact__c, NDIS_Number__c, Date_of_Birth__c,
                Classification1__c, Provider_Budget__c, Plan_Start_Date__c,
                Plan_End_Date__c, Support_Coordinator_Budget__c,
                Risk_Level__c, Support_Category__c,
                Selected_Service_Types__c, Type_of_Industry__c,
                Total_Plan_Budget__c, Number_Of_Goals__c,
                About_Participant1__c, SupportClient_To_Staff__c,
                Organization__c, Address__Street__s,
                Address__City__s, Address__StateCode__s,
                Address__PostalCode__s, Address__CountryCode__s,
                Is_Pinned__c, Budget_Spent_to_Date__c, Status__c,
    
                (
                    SELECT
                        Id, Name, Service_Type__c, State__c,
                        BudgetAllocation__c, AmountSpent__c,
                        Budget_Spent_to_Date__c,
    
                        (
                            SELECT
                                Id, Name, Support_Item_Name__c,
                                Support_Item_Number__c,
                               // SupportCatlogue_To_SupportProvider__c,
                               // SupportCatlogue_To_SupportProvider__r.Name,
                                State__c, Amount__c, IsActive__c,Preffered_Staff__c,
                                (
                                    SELECT Id, Support_Provider__c, Support_Provider__r.Name
                                    FROM Support_Child_Provider__r
                                )
                            FROM Support_Catalogues__r
                        )
    
                    FROM Support_CatalogueGroups__r
                ),
            (
                    SELECT
                        Id,
                        Name,
                        State__c,
                        BudgetAllocation__c,
                        AmountSpent__c,
                        Budget_Spent_to_Date__c,
                
                        (
                            SELECT
                                Id,
                                Name,
                                Support_Item_Name__c,
                                Support_Item_Number__c,
                                State__c,
                                Amount__c,
                                IsActive__c
                
                            FROM Support_CoordinatorCatalogue__r
                        )
                
                    FROM Support_CoordinatorCatalogueGroup__r
                ),    
                (
                    SELECT
                        Id, Name, First_Name__c,
                        Last_Name__c, Contact_Number__c,
                        Email__c, Contact_Type__c,
                        Notify__c,
    
                        (
                            SELECT
                                Id, Name, File_Name__c,
                                Amazon_file_URL__c, Key__c, Size__c,Type__c,Comments__c,
                                Other_Comments__c,Expiry_Date__c,User__c,Added_By__c
                            FROM Support_Client_Contact_Attachment__r
                        )
    
                    FROM Support_Client_Contacts__r
                ),
    
                (
                    SELECT
                        Id, Name, Case_Note_Content__c,
                        Notes_Type__c, Billable__c,
                        CreatedDate, OwnerId
                    FROM SupportNotes1__r
                )
    
            FROM Support_Client__c
    
            WHERE Id = :participantId
    
            LIMIT 1
        ];
    
        return participantDetails.isEmpty()
            ? null
            : participantDetails[0];
    }
    
    @AuraEnabled
    public static List<Support_Coordinator__c> fetchSupportCoordinatorCatalogue( String serviceType, Date serviceDate ) {
        if (String.isBlank(serviceType)) {
            return new List<Support_Coordinator__c>();
        }
    
        // Resolve service date (same pattern as Client Apex)
        Date sDate = serviceDate != null ? serviceDate : Date.today();
    
        Integer year = sDate.year();
        Integer fyStartYear =
            sDate < Date.newInstance(year, 7, 1) ? year - 1 : year;
    
        Date financialStartDate = Date.newInstance(fyStartYear, 7, 1);
    
        return [
            SELECT Id,
                   Name,
                   Support_Item_Name__c,
                   Support_Item_Number__c,
                   ACT__c, NSW__c, VIC__c, QLD__c,
                   WA__c, SA__c, TAS__c, NT__c
            FROM Support_Coordinator__c
            WHERE Name = :serviceType
              AND Start_Date__c = :financialStartDate
            ORDER BY Support_Item_Name__c
        ];
    }

    @AuraEnabled
    public static List<Support_CoordinatorCatalogue__c> fetchParticipantSupportCoordinatorCatalogues( Id supportClientId, String serviceType, String state) {
        if (supportClientId == null || String.isBlank(serviceType)) {
            return new List<Support_CoordinatorCatalogue__c>();
        }
    
        // Step 1: Fetch parent group
        List<Support_CoordinatorCatalogueGroup__c> groups = [
        	SELECT Id
            FROM Support_CoordinatorCatalogueGroup__c
            WHERE Support_Client__c = :supportClientId
            AND Name = :serviceType
           	LIMIT 1
        ];
    
        if (groups.isEmpty()) {
            return new List<Support_CoordinatorCatalogue__c>();
        }
    
        Id parentGroupId = groups[0].Id;
    
        // Step 2: Fetch child records
        return [
            SELECT Id,
                   Support_Coordinator_Catalogue__c,
                   IsActive__c,
                   State__c
                   //SupportCatlogue_To_SupportProvider__c
            FROM Support_CoordinatorCatalogue__c
            WHERE Support_CoordinatorCatalogueGroup__c = :parentGroupId
            AND State__c = :state
            
        ];
    }

    @AuraEnabled
    public static List<String> fetchCoordinatorServiceTypes() {
    
        List<AggregateResult> results = [
            SELECT Name
            FROM Support_Coordinator__c
            GROUP BY Name
            ORDER BY Name
        ];
    
        List<String> serviceTypes = new List<String>();
    
        for (AggregateResult ar : results) {
            serviceTypes.add((String) ar.get('Name'));
        }
    
        return serviceTypes;
    }


    @AuraEnabled
    public static List<Map<String, Object>> getServiceTypesByParticipant( Id participantId ) {
        List<Map<String, Object>> result = new List<Map<String, Object>>();

        if (participantId == null) {
            return result;
        }

        List<Support_CoordinatorCatalogueGroup__c> groups = [
            SELECT
                Id,
                Name,
                (
                    SELECT
                        Id,
                        Name,
                        Amount__c,
                        Support_Item_Name__c,
                        Support_Item_Number__c
                    FROM Support_CoordinatorCatalogue__r 
                )
            FROM Support_CoordinatorCatalogueGroup__c
            WHERE Support_Client__c = :participantId
            ORDER BY Name
        ];

        for (Support_CoordinatorCatalogueGroup__c grp : groups) {
            Map<String, Object> row = new Map<String, Object>();
            row.put('Id', grp.Id);
            row.put('Name', grp.Name);
            row.put('Support_Catalogues__r', grp.Support_CoordinatorCatalogue__r);

            result.add(row);
        }

        return result;
    }

    @AuraEnabled
    public static Id saveSupportNote(Map<String, Object> noteData) {
        try {
            System.debug('================ saveSupportNote START ================');
            System.debug('Incoming noteData => ' + noteData);

            if (noteData == null) {
                throw new AuraHandledException('No data received.');
            }

            Id participantId =
                (Id)noteData.get('participant');

            if (participantId == null) {
                throw new AuraHandledException(
                    'Participant is required.'
                );
            }

            Boolean isBillable =
                noteData.containsKey('billable')
                ? (Boolean)noteData.get('billable')
                : false;

           
             Decimal hours1 =
                noteData.containsKey('duration') &&
                noteData.get('duration') != null &&
                !String.isBlank(String.valueOf(noteData.get('duration')))
                ? Decimal.valueOf(String.valueOf(noteData.get('duration')))
                : 0;
            Decimal minutes1 =
                noteData.containsKey('durationMinutes') &&
                noteData.get('durationMinutes') != null &&
                !String.isBlank(String.valueOf(noteData.get('durationMinutes')))
                ? Decimal.valueOf(String.valueOf(noteData.get('durationMinutes')))
                : 0;

            Decimal duration = (hours1 + (minutes1 / 60)).setScale(2);


            Decimal entryCost =
                noteData.containsKey('entryCost')
                ? Decimal.valueOf(
                    String.valueOf(noteData.get('entryCost'))
                )
                : 0;

            /* ==========================================
            GET USER / STAFF / ORG
            ========================================== */
            User currentUser = [
                SELECT Id, Email, Organization_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            List<Organisation__c> orgList = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :currentUser.Organization_Name__c
                LIMIT 1
            ];

            if (orgList.isEmpty()) {
                throw new AuraHandledException(
                    'No Organisation record found for logged in user.'
                );
            }

            Id orgId = orgList[0].Id;

            /* ==========================================
            PARTICIPANT BUDGET VALIDATION
            ========================================== */
            Support_Client__c participant = [
                SELECT
                    Id,
                    Support_Coordinator_Budget__c,
                    Support_Coordinator_Spent_Budget__c
                FROM Support_Client__c
                WHERE Id = :participantId
                LIMIT 1
            ];

            if (isBillable) {
                Decimal totalBudget =
                    participant.Support_Coordinator_Budget__c != null
                    ? participant.Support_Coordinator_Budget__c
                    : 0;

                Decimal currentSpent =
                    participant.Support_Coordinator_Spent_Budget__c != null
                    ? participant.Support_Coordinator_Spent_Budget__c
                    : 0;

                Decimal remaining = totalBudget - currentSpent;

                System.debug('Total Budget => ' + totalBudget);
                System.debug('Current Spent => ' + currentSpent);
                System.debug('Remaining => ' + remaining);
                System.debug('Entry Cost => ' + entryCost);

                if (entryCost > remaining) {
                    throw new AuraHandledException(
                        'Insufficient participant funds.'
                    );
                }
            }

            /* ==========================================
            CREATE SUPPORT NOTE
            ========================================== */
            Support_Notes__c note = new Support_Notes__c();

            note.SupportClient_To_Notes__c = participantId;

            note.Organization__c = orgId;

            note.Entry_Date__c =
                Date.valueOf(
                    String.valueOf(noteData.get('date'))
                );

            note.Notes_Type__c =
                String.valueOf(noteData.get('title'));

            //note.Contact_Method__c = 'Task';

            note.Activity_Details__c =
                String.valueOf(noteData.get('description'));

            if (noteData.get('startTime') != null) {
                String startTime = String.valueOf(noteData.get('startTime'));
                System.debug('Start Time from LWC: ' + startTime);

                List<String> parts = startTime.split(':');

                Integer hours = Integer.valueOf(parts[0]);
                Integer minutes = Integer.valueOf(parts[1]);

                note.Start_Time__c = Time.newInstance(hours, minutes, 0, 0);

                System.debug('Parsed Start Time: ' + note.Start_Time__c);
            }

            note.Billable__c = isBillable;

            note.Created_From__c = 'Task';

            if (isBillable) {
                note.Duration_Hours__c = String.valueOf(duration);

                note.Charge_Level__c =
                    String.valueOf(noteData.get('chargeLevel'));

                note.Total_Cost__c = String.valueOf(entryCost);

                if (noteData.get('ServiceType') != null) {
                    note.Support_CoordinatorCatalogueGroup__c =
                        (Id)noteData.get('ServiceType');
                }

                if (noteData.get('ServiceItem') != null) {
                    note.Support_CoordinatorCatalogue__c =
                        (Id)noteData.get('ServiceItem');
                }
            }

            insert note;

            System.debug('Support Note Created => ' + note.Id);

            /* ==========================================
            UPDATE PARTICIPANT SPENT BUDGET
            ========================================== */
            if (isBillable) {
                Decimal existingSpent =
                    participant.Support_Coordinator_Spent_Budget__c != null
                    ? participant.Support_Coordinator_Spent_Budget__c
                    : 0;

                participant.Support_Coordinator_Spent_Budget__c =
                    existingSpent + entryCost;

                update participant;

                System.debug(
                    'Updated Participant Spent Budget => ' +
                    participant.Support_Coordinator_Spent_Budget__c
                );
            }

            System.debug('================ saveSupportNote END ================');

            return note.Id;

        } catch (Exception e) {
            System.debug('ERROR => ' + e.getMessage());

            throw new AuraHandledException(
                e.getMessage()
            );
        }
    }
   @AuraEnabled
    public static Map<Id, Integer> getContactAttachmentCounts(List<Id> contactIds) {

        System.debug( ' contactIds received => ' +   JSON.serialize(contactIds)  );

        Map<Id, Integer> countMap =
            new Map<Id, Integer>();

        if (contactIds == null || contactIds.isEmpty()) {
             System.debug( ' No contactIds received' );
            return countMap;
        }

        List<AggregateResult> results = [
            SELECT  Support_Client_Contact__c contactId,  COUNT(Id) total

            FROM Support_Client_Contact_Attachment__c
            WHERE Support_Client_Contact__c IN :contactIds
            GROUP BY Support_Client_Contact__c
        ];

        System.debug('agregate Results => ' + JSON.serialize(results));

        for (AggregateResult ar : results) {
            Id contactId =  (Id) ar.get('contactId');
            Integer total =(Integer) ar.get('total');
            countMap.put(
                contactId,
                total
            );
        }

        System.debug('attachment Count Map => ' + JSON.serialize(countMap) );
        return countMap;
    }

@AuraEnabled
public static List<
    Support_Client_Contact_Attachment__c
> getAllContactAttachments(Id clientId) {

    if (clientId == null) {

        return new List<
            Support_Client_Contact_Attachment__c
        >();
    }

    return [

        SELECT
            Id,
            Name,
            File_Name__c,
            Amazon_file_URL__c,
            Key__c,
            Size__c,
            CreatedDate,
            CreatedBy.Name,
            Support_Client_Contact__r.First_Name__c,
            Support_Client_Contact__r.Last_Name__c

        FROM
            Support_Client_Contact_Attachment__c

        WHERE
            Support_Client_Contact__r.Support_Client__c
                = :clientId

        ORDER BY
            CreatedDate DESC
    ];
}
@AuraEnabled
public static List<
    Support_Client_Contact_Attachment__c
> getContactAttachments(Id contactId) {

    if (contactId == null) {

        return new List<
            Support_Client_Contact_Attachment__c
        >();
    }

    return [

        SELECT
            Id,
            Name,
            File_Name__c,
            Amazon_file_URL__c,
            Key__c,
            Size__c,
            CreatedDate,
            CreatedBy.Name,
            Type__c,
            Comments__c,
            Other_Comments__c,
            Expiry_Date__c,
            Added_By__c,
            User__c

        FROM
            Support_Client_Contact_Attachment__c

        WHERE
            Support_Client_Contact__c = :contactId

        ORDER BY
            CreatedDate DESC
    ];
}

  @AuraEnabled
    public static void deleteContactAttachment(Id attachmentId) {

        if (attachmentId == null) {
            throw new AuraHandledException('Attachment Id is required');
        }

        delete [
            SELECT Id
            FROM Support_Client_Contact_Attachment__c
            WHERE Id = :attachmentId
            LIMIT 1
        ];
    }
}