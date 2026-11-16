public with sharing class CatalogueController {

    @AuraEnabled
    public static void saveCatalogue( String formDataJson) {

        System.debug('formDataJson ==> ' + formDataJson);

        User objUser = [ SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];

        Id orgId;
        List<Organisation__c> orgNames = [ SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1];
        if (!orgNames.isEmpty()) {
            orgId = orgNames[0].Id;
            System.debug('orgId ==> ' + orgId);
        }
        if (orgId == null) {
            return;
        }
        if (String.isBlank(formDataJson)) {
           // throw new AuraHandledException('Catalogue data is missing.');
            return;
        }

        // 2️⃣ Deserialize form data
        Map<String, Object> formData =(Map<String, Object>) JSON.deserializeUntyped(formDataJson);

        Boolean isClone = formData.containsKey('isClone')
                            ? (Boolean)formData.get('isClone')
                            : false;

        //List<Object> facilityList = (List<Object>)formData.get('facilityIds');
        List<Object> facilityList = formData.containsKey('facilityIds')
                                    ? (List<Object>)formData.get('facilityIds')
                                    : null;
        System.debug('formData Map ==> ' + formData);

        // 🔑 Get catalogue Id from form data (for edit)
        Id catalogueId = null;

        if (formData.containsKey('Id')) {
            String idStr = (String) formData.get('Id');

            if (!String.isBlank(idStr)) {
                catalogueId = (Id) idStr;
            }
        }

        System.debug('Catalogue Id ==> ' + catalogueId);


        NDIS_Support_Catalogue__c ndisCatalogue =
            catalogueId != null
                ? new NDIS_Support_Catalogue__c(Id = catalogueId)
                : new NDIS_Support_Catalogue__c();

        ndisCatalogue.Organization__c = orgId;
        mapCommonFields(ndisCatalogue, formData);

        // ✅ UPSERT (Insert or Update)
        upsert ndisCatalogue;

        if(isClone){

            Date todayDate = Date.today();
            Integer startYear;

            if(todayDate >= Date.newInstance(todayDate.year(),7,1)){
                startYear = todayDate.year();
            }else{
                startYear = todayDate.year()-1;
            }

            String currentFinancialYear =
                String.valueOf(startYear)
                + '-'
                + String.valueOf(startYear + 1).right(2);

            Service_Catalogue__c sc = new Service_Catalogue__c();

            sc.Organization__c = orgId;
            sc.Financial_Year__c = currentFinancialYear;
            sc.Type_of_Industry__c = (String)formData.get('industryType');
            sc.NDIS_Support_Catalogue__c = ndisCatalogue.Id;
            sc.Active__c = true;

            insert sc;

            List<Service_Catalogue_Facilty__c> facilityRecords = new List<Service_Catalogue_Facilty__c>();

            if(facilityList != null){

                for(Object obj : facilityList){
                     if (obj == null) {
                        continue;
                    }

                    facilityRecords.add(
                        new Service_Catalogue_Facilty__c(
                            Service_Catalogue__c = sc.Id,
                            Facility__c = (Id)obj,
                            Active__c = true
                        )
                    );
                }

                if(!facilityRecords.isEmpty()){
                    insert facilityRecords;
                }
            }
        }
    }
    public static void mapCommonFields(SObject catalogue, Map<String, Object> formData) {
        catalogue.put('Type_of_Industry__c', (String) formData.get('industryType'));
        catalogue.put('Name', (String) formData.get('serviceType'));
        catalogue.put('Support_Item_Name__c', (String) formData.get('supportItemName'));
        catalogue.put('Support_Item_Number__c', (String) formData.get('supportItemNumber'));

        catalogue.put('ACT__c', getDecimal(formData.get('ACT')));
        catalogue.put('NSW__c', getDecimal(formData.get('NSW')));
        catalogue.put('NT__c',  getDecimal(formData.get('NT')));
        catalogue.put('QLD__c', getDecimal(formData.get('QLD')));
        catalogue.put('SA__c',  getDecimal(formData.get('SA')));
        catalogue.put('TAS__c', getDecimal(formData.get('TAS')));
        catalogue.put('VIC__c', getDecimal(formData.get('VIC')));
        catalogue.put('WA__c',  getDecimal(formData.get('WA')));
    }

    private static Decimal getDecimal(Object value) {
        if (value == null) return 0;
        if (value instanceof Decimal) return (Decimal) value;
        return Decimal.valueOf(String.valueOf(value));
    }

    @AuraEnabled
    public static void processBulkSelectedRecords( Id facilityId, String selectedRecordsJson ) {

        System.debug('FacilityId ==> ' + facilityId);
        System.debug('Payload ==> ' + selectedRecordsJson);

        if (facilityId == null || String.isBlank(selectedRecordsJson)) {
            throw new AuraHandledException('Invalid input data');
        }

        // 🔹 Deserialize payload
        List<Object> records =
            (List<Object>) JSON.deserializeUntyped(selectedRecordsJson);

        if (records.isEmpty()) {
            System.debug('No records received');
            return;
        }

        // 🔹 Get facility info (if needed)
        Facility__c facility = [
            SELECT Id, Type_of_Service__c
            FROM Facility__c
            WHERE Id = :facilityId
            LIMIT 1
        ];

        // 🔥 STEP 1 — Collect catalogue IDs from payload
        Set<Id> catalogueIds = new Set<Id>();

        for (Object obj : records) {
            Map<String, Object> recordMap = (Map<String, Object>) obj;

            if (recordMap.containsKey('Id') && recordMap.get('Id') != null) {
                catalogueIds.add((Id) recordMap.get('Id'));
            }
        }

        // 🔥 STEP 2 — Fetch existing Service Catalogue records
        Map<Id, Service_Catalogue__c> existingMap =
            new Map<Id, Service_Catalogue__c>();

        if (!catalogueIds.isEmpty()) {
            for (Service_Catalogue__c sc : [
                SELECT Id, NDIS_Support_Catalogue__c, Active__c
                FROM Service_Catalogue__c
                WHERE Facility__c = :facilityId
                AND NDIS_Support_Catalogue__c IN :catalogueIds
            ]) {
                existingMap.put(sc.NDIS_Support_Catalogue__c, sc);
            }
        }

        // 🔥 STEP 3 — Prepare DML lists
        List<Service_Catalogue__c> toInsert = new List<Service_Catalogue__c>();
        List<Service_Catalogue__c> toUpdate = new List<Service_Catalogue__c>();

        // 🔥 STEP 4 — Process each payload record
        for (Object obj : records) {

            Map<String, Object> recordMap = (Map<String, Object>) obj;

            Id catalogueId = (Id) recordMap.get('Id');
            Boolean isSelected = (Boolean) recordMap.get('isSelected');

            Service_Catalogue__c existing =
                existingMap.get(catalogueId);

            // =========================================
            // CASE 1 — Existing record → UPDATE
            // =========================================
            if (existing != null) {

                // Update only if value changed
                if (existing.Active__c != isSelected) {

                    existing.Active__c = isSelected;
                    toUpdate.add(existing);
                }

                continue;
            }

            // =========================================
            // CASE 2 — New record → INSERT only if selected
            // =========================================
            if (isSelected) {

                Service_Catalogue__c sc = new Service_Catalogue__c();
                sc.Facility__c = facilityId;
                sc.NDIS_Support_Catalogue__c = catalogueId;
                sc.Active__c = true;

                toInsert.add(sc);
            }

            // If NOT selected and no existing record → do nothing
        }

        // 🔥 STEP 5 — Perform DML
        if (!toUpdate.isEmpty()) {
            update toUpdate;
        }

        if (!toInsert.isEmpty()) {
            insert toInsert;
        }

        System.debug(
            'Bulk processed — Updated: ' + toUpdate.size() +
            ', Inserted: ' + toInsert.size()
        );
    }

    @AuraEnabled
    public static List<Service_Catalogue__c> getfacilityselectedCatalogue(Id facilityId) {

        System.debug('FacilityId received ==> ' + facilityId);

        if (facilityId == null) {
            return new List<Service_Catalogue__c>();
        }

        return [
            SELECT Id,
                Facility__c,
                Active__c,
                NDIS_Support_Catalogue__c
            FROM Service_Catalogue__c
            WHERE Facility__c = :facilityId
        ];
    }

       @AuraEnabled
    public static Map<Id, List<Service_Catalogue__c>> getServiceCataloguesByClient(Id clientId, String approvedDate ) {

        Map<Id, List<Service_Catalogue__c>> facilityToCatalogues =new Map<Id, List<Service_Catalogue__c>>();

        if (clientId == null  || String.isBlank(approvedDate)) {
            return facilityToCatalogues;
        }
       
        Date approvedDt = Date.valueOf(approvedDate);
        Integer startYear = (approvedDt.month() < 7)
                            ? approvedDt.year() - 1
                            : approvedDt.year();
        String financialYear = startYear + '-' + String.valueOf(startYear + 1).right(2);
        System.debug('Financial Year :: ' + financialYear);

        // 1️⃣ Collect Facility Ids from Participant Facilities
        Set<Id> facilityIds = new Set<Id>();
        Set<String> typeOfIndustries = new Set<String>();

        Client__c clientRec = [
            SELECT
                Id,
                (
                    SELECT Id, Facility__c, Facility__r.Type_of_Service__c
                    FROM Participant_Facilities__r
                )
            FROM Client__c
            WHERE Id = :clientId
            LIMIT 1
        ];

        if (clientRec.Participant_Facilities__r != null) {
            for (Participant_Facility__c pf : clientRec.Participant_Facilities__r) {
                if (pf.Facility__c != null) {
                    facilityIds.add(pf.Facility__c);
                }
                if (pf.Facility__r.Type_of_Service__c != null) {
                    typeOfIndustries.add(pf.Facility__r.Type_of_Service__c);
                }
            }
        }
        System.debug('Type Of Industries: ' + typeOfIndustries);

        if (facilityIds.isEmpty() || typeOfIndustries.isEmpty()) {      
            return facilityToCatalogues;
        }
        List<Service_Catalogue_Facilty__c> junctions = [
            SELECT
                Service_Catalogue__c,
                Facility__c
                // Service_Catalogue__r.Id,
                // Service_Catalogue__r.Name,
                // Service_Catalogue__r.Active__c,
                // Service_Catalogue__r.Financial_Year__c,
                // Service_Catalogue__r.NDIS_Support_Catalogue__c,
                // Service_Catalogue__r.NDIS_Support_Catalogue__r.Name,
                // Service_Catalogue__r.Type_of_Industry__c
            FROM Service_Catalogue_Facilty__c
            WHERE Active__c = true
            AND Facility__c IN :facilityIds
            // AND Service_Catalogue__r.Active__c = true
            // AND Service_Catalogue__r.Financial_Year__c = :financialYear
            // AND Service_Catalogue__r.Type_of_Industry__c IN :typeOfIndustries
        ];

        if (junctions.isEmpty()) {
            return facilityToCatalogues;
        }
        Set<Id> serviceCatalogueIds = new Set<Id>();

        for (Service_Catalogue_Facilty__c junction : junctions) {
            serviceCatalogueIds.add(junction.Service_Catalogue__c);
        }
       
        Map<Id, Service_Catalogue__c> serviceCatalogueMap =
            new Map<Id, Service_Catalogue__c>([
                SELECT
                    Id,
                    Name,
                    Active__c,
                    Financial_Year__c,
                    Type_of_Industry__c,
                    NDIS_Support_Catalogue__c,
                    NDIS_Support_Catalogue__r.Name
                FROM Service_Catalogue__c
                WHERE Id IN :serviceCatalogueIds
                AND Active__c = true
                AND Financial_Year__c = :financialYear
                AND Type_of_Industry__c IN :typeOfIndustries
            ]);

        // Build Facility -> Service Catalogue Map
        for (Service_Catalogue_Facilty__c junction : junctions) {

            Service_Catalogue__c sc =
                serviceCatalogueMap.get(junction.Service_Catalogue__c);

            if (sc == null) {
                continue;
            }

            if (!facilityToCatalogues.containsKey(junction.Facility__c)) {
                facilityToCatalogues.put(
                    junction.Facility__c,
                    new List<Service_Catalogue__c>()
                );
            }

            facilityToCatalogues
                .get(junction.Facility__c)
                .add(sc);
        }

        return facilityToCatalogues;
    }

    @AuraEnabled
    public static List<Services_and_Support_Plan__c> removeServiceGroup( Id clientId, Id serviceGroupId ) {
        System.debug('Client Id: ' + clientId);
        System.debug('Service Group Id: ' + serviceGroupId);

        List<Services_and_Support_Plan__c> futureRecords = [
            SELECT Id, Client__c, Service_Type__c, Date_of_Service__c
            FROM Services_and_Support_Plan__c
            WHERE Client__c = :clientId
            AND Service_Type__c = :serviceGroupId
            AND Date_of_Service__c > TODAY
        ];

        System.debug('Future Records Count: ' + futureRecords.size());

        return futureRecords;
    }

    //  @AuraEnabled
    //  public static List<Services_and_Support_Plan__c> handleUncheck(Id facilityId, Id recordId) {

    //      System.debug('===== handleUncheck START =====');

    //     // 🔹 Input Parameters
    //      System.debug('➡️ Input facilityId: ' + facilityId);
    //     System.debug('➡️ Input recordId (Service Type): ' + recordId);

    //      // 🔹 Null checks
    //      if (facilityId == null) {
    //          System.debug('⚠️ facilityId is NULL');
    //      } else {
    //          System.debug('✅ facilityId is NOT NULL');
    //      }

    //      if (recordId == null) {
    //          System.debug('⚠️ recordId is NULL');
    //      } else {
    //          System.debug('✅ recordId is NOT NULL');
    //      }

    //      // 🔹 Current date context
    //      System.debug('📅 Today (System.today): ' + System.today());
    //      System.debug('📅 Now (System.now): ' + System.now());

    //      // 🔹 About to run SOQL
    //      System.debug('🔍 Executing SOQL query for future Services_and_Support_Plan__c records...');

    //      List<Services_and_Support_Plan__c> futureRecords = [
    //          SELECT Id,
    //              Client__c,
    //              Service_Type__c,
    //              Date_of_Service__c,
    //              ShiftwithStaff__r.Add_Shift__r.Facility__c
    //          FROM Services_and_Support_Plan__c
    //          WHERE ShiftwithStaff__r.Add_Shift__r.Facility__c = :facilityId
    //          AND Service_Type__c = :recordId
    //          AND Date_of_Service__c > TODAY
    //      ];

    //      System.debug('🔍 SOQL query executed');

    //      // 🔹 Result count
    //      Integer recordCount = futureRecords.size();
    //      System.debug('📊 Future Records Count: ' + recordCount);

    //      // 🔹 Detailed record output (safe for small lists)
    //      if (recordCount > 0) {

    //          System.debug('📦 Future Records FOUND — iterating through results');

    //          for (Services_and_Support_Plan__c rec : futureRecords) {

    //              System.debug('--- Record START ---');
    //              System.debug('🆔 Id: ' + rec.Id);
    //              System.debug('👤 Client__c: ' + rec.Client__c);
    //              System.debug('🛠 Service_Type__c: ' + rec.Service_Type__c);
    //              System.debug('📅 Date_of_Service__c: ' + rec.Date_of_Service__c);

    //             if (rec.ShiftwithStaff__r != null &&
    //                  rec.ShiftwithStaff__r.Add_Shift__r != null) {

    //                  System.debug('🏢 Facility__c: ' +
    //                      rec.ShiftwithStaff__r.Add_Shift__r.Facility__c);

    //              } else {

    //                  System.debug('⚠️ Relationship ShiftwithStaff__r or Add_Shift__r is NULL');
    //              }

    //              System.debug('--- Record END ---');
    //          }

    //      } else {

    //          System.debug('📭 No future records found for given criteria');
    //      }

    //      System.debug('===== handleUncheck END =====');

    //      return futureRecords;
    //  }

     @AuraEnabled
    public static Map<String, Boolean> handleUncheckOrgWise(Id ndisCatalogueId){
        System.debug('===== handleUncheck START =====');

        //  Input Parameters
        System.debug('ndisCatalogueId : ' + ndisCatalogueId);

        if (ndisCatalogueId == null) {
            System.debug('⚠️ ndisCatalogueId is NULL');
           // return new List<Services_and_Support_Plan__c>();
            Map<String, Boolean> result = new Map<String, Boolean>();
            result.put('hasFutureShifts', false);
            result.put('hasFunds', false);
            return result;
        }

        Set<Id> facilityIds = new Set<Id>();
        for (Service_Catalogue_Facilty__c junction : [
            SELECT Facility__c
            FROM Service_Catalogue_Facilty__c
            WHERE Service_Catalogue__r.NDIS_Support_Catalogue__c = :ndisCatalogueId
            AND Active__c = true
            AND Facility__c != null
        ]) {

            facilityIds.add(junction.Facility__c);
        }

        System.debug('Linked Facility Ids ==> ' + facilityIds);
         if (facilityIds.isEmpty()) {
            //return new List<Services_and_Support_Plan__c>();
             Map<String, Boolean> result = new Map<String, Boolean>();
            result.put('hasFutureShifts', false);
            result.put('hasFunds', false); 
            return result;
        }
        // 🔹 Current date context
        System.debug('📅 Today (System.today): ' + System.today());
        System.debug('📅 Now (System.now): ' + System.now());

        // Integer fundCount = [
        //     SELECT COUNT()
        //     FROM ClientFundTrackerJN__c
        //     WHERE NDIS_Support_Catalogue__c = :ndisCatalogueId
        //     AND Funds_Tracker__r.Status__c = 'Active'
        // ];
        Set<Id> participantIds = new Set<Id>();

        for (Participant_Facility__c pf : [
            SELECT Participant__c
            FROM Participant_Facility__c
            WHERE Facility__c IN :facilityIds
            AND Active__c = true
            AND Participant__c != null
        ]) {
            participantIds.add(pf.Participant__c);
        }

        Integer fundCount = 0;

        if (!participantIds.isEmpty()) {
            fundCount = [
                SELECT COUNT()
                FROM ClientFundTrackerJN__c
                WHERE Participant__c IN :participantIds
                AND NDIS_Support_Catalogue__c = :ndisCatalogueId
                AND Funds_Tracker__r.Status__c = 'Active'
            ];
        }
        System.debug('📊 Associated Fund Count: ' + fundCount);
       

        System.debug('🔍 Executing SOQL query for future Services_and_Support_Plan__c records...');
        List<Services_and_Support_Plan__c> futureRecords = [
            SELECT Id,
                Client__c,
                Service_Type__c,
                Date_of_Service__c,
                ShiftwithStaff__r.Add_Shift__r.Facility__c
            FROM Services_and_Support_Plan__c
            WHERE Service_Type__c = :ndisCatalogueId
            AND ShiftwithStaff__r.Add_Shift__r.Facility__c IN :facilityIds
            AND Date_of_Service__c > TODAY
        ];

        System.debug('🔍 SOQL query executed');

        // 🔹 Result count
        Integer futureRecordCount = futureRecords.size();
        System.debug('📊 Future Records Count: ' + futureRecordCount);

        // 🔹 Detailed record output (safe for small lists)
        if (futureRecordCount > 0) {

            System.debug('📦 Future Records FOUND — iterating through results');

            for (Services_and_Support_Plan__c rec : futureRecords) {

                System.debug('--- Record START ---');
                System.debug('🆔 Id: ' + rec.Id);
                System.debug('👤 Client__c: ' + rec.Client__c);
                System.debug('🛠 Service_Type__c: ' + rec.Service_Type__c);
                System.debug('📅 Date_of_Service__c: ' + rec.Date_of_Service__c);

                if (rec.ShiftwithStaff__r != null &&
                    rec.ShiftwithStaff__r.Add_Shift__r != null) {

                    System.debug('🏢 Facility__c: ' +
                        rec.ShiftwithStaff__r.Add_Shift__r.Facility__c);

                } else {

                    System.debug('⚠️ Relationship ShiftwithStaff__r or Add_Shift__r is NULL');
                }

                System.debug('--- Record END ---');
            }

        } else {

            System.debug('📭 No future records found for given criteria');
        }
        Map<String, Boolean> result = new Map<String, Boolean>();
        result.put('hasFutureShifts', futureRecordCount > 0);
        result.put('hasFunds', fundCount > 0);
        System.debug('===== handleUncheck END =====');

       // return futureRecords;
       return result;
    }

    //  @AuraEnabled
    //  public static Map<Id, Boolean> processBulkSelectedRecordsUncheck(Id facilityId, List<Id> recordIds) {

    //      System.debug('FacilityId: ' + facilityId);
    //      System.debug('RecordIds: ' + recordIds);

    //      Map<Id, Boolean> resultMap = new Map<Id, Boolean>();

    //      // ✅ Query future records
    //      List<Services_and_Support_Plan__c> futureRecords = [
    //          SELECT Service_Type__c
    //          FROM Services_and_Support_Plan__c
    //          WHERE ShiftwithStaff__r.Add_Shift__r.Facility__c = :facilityId
    //          AND Service_Type__c IN :recordIds
    //          AND Date_of_Service__c > TODAY
    //     ];

    //      // ✅ Store which recordIds have future records
    //      Set<Id> futureServiceIds = new Set<Id>();

    //      for (Services_and_Support_Plan__c rec : futureRecords) {
    //          futureServiceIds.add(rec.Service_Type__c);
    //      }

    //      // ✅ Build result for ALL input ids
    //      for (Id recId : recordIds) {
    //          if (futureServiceIds.contains(recId)) {
    //              resultMap.put(recId, true);  // has future records
    //          } else {
    //              resultMap.put(recId, false); // no future records
    //          }
    //     }

    //      System.debug('Result Map: ' + resultMap);

    //      return resultMap;
    //  }
   
     @AuraEnabled
    public static Map<Id, Map<String, Boolean>> processBulkUncheckOrgWise(List<Id> ndisCatalogueIds) {

        System.debug(' Service Catalogue Ids: ' + ndisCatalogueIds);

        Map<Id, Map<String, Boolean>> resultMap = new Map<Id, Map<String, Boolean>>();
        if (ndisCatalogueIds == null || ndisCatalogueIds.isEmpty()) {
            return resultMap;
        }
         // Default all to false
        // for (Id ndisId : ndisCatalogueIds) {
        //     resultMap.put(ndisId, false);
        // }
        Map<Id, Set<Id>> catalogueFacilityMap = new Map<Id, Set<Id>>();
        Set<Id> allFacilityIds = new Set<Id>();

        for (Service_Catalogue_Facilty__c junction : [
            SELECT Service_Catalogue__c,
                Facility__c,Service_Catalogue__r.NDIS_Support_Catalogue__c
            FROM Service_Catalogue_Facilty__c
            WHERE Service_Catalogue__r.NDIS_Support_Catalogue__c IN :ndisCatalogueIds
            AND Active__c = true
            AND Facility__c != null
        ]) {

             Id ndisId = junction.Service_Catalogue__r.NDIS_Support_Catalogue__c;

            if (!catalogueFacilityMap.containsKey(ndisId)) {
                catalogueFacilityMap.put(ndisId, new Set<Id>());
            }

            catalogueFacilityMap.get(ndisId).add(junction.Facility__c);
            allFacilityIds.add(junction.Facility__c);
        }

        System.debug('Catalogue -> Facilities : ' + catalogueFacilityMap);
        // Set<Id> fundServiceIds = new Set<Id>();

        // for (ClientFundTrackerJN__c fund : [
        //     SELECT NDIS_Support_Catalogue__c
        //     FROM ClientFundTrackerJN__c
        //     WHERE NDIS_Support_Catalogue__c IN :ndisCatalogueIds
        //     AND Funds_Tracker__r.Status__c = 'Active'
        // ]) {
        //     fundServiceIds.add(fund.NDIS_Support_Catalogue__c);
        // }

        // System.debug('Support Items with Funds : ' + fundServiceIds);

        if (allFacilityIds.isEmpty()) {
            for (Id recId : ndisCatalogueIds) {
                Map<String, Boolean> status = new Map<String, Boolean>();
                status.put('hasFutureShifts', false);
                status.put('hasFunds', false);
                resultMap.put(recId, status);
            }
            return resultMap;
        }
        Map<Id, Set<Id>> facilityParticipantMap = new Map<Id, Set<Id>>();
        Set<Id> participantIds = new Set<Id>();

        for (Participant_Facility__c pf : [
            SELECT Facility__c, Participant__c
            FROM Participant_Facility__c
            WHERE Facility__c IN :allFacilityIds
            AND Active__c = true
            AND Participant__c != null
        ]) {
            participantIds.add(pf.Participant__c);

            if (!facilityParticipantMap.containsKey(pf.Facility__c)) {
                facilityParticipantMap.put(pf.Facility__c, new Set<Id>());
            }

            facilityParticipantMap.get(pf.Facility__c).add(pf.Participant__c);
        }

        // Participants having active funds
        Map<Id, Set<Id>> participantFundMap = new Map<Id, Set<Id>>();

        if (!participantIds.isEmpty()) {

            for (ClientFundTrackerJN__c fund : [
                SELECT Participant__c, NDIS_Support_Catalogue__c
                FROM ClientFundTrackerJN__c
                WHERE Participant__c IN :participantIds
                AND NDIS_Support_Catalogue__c IN :ndisCatalogueIds
                AND Funds_Tracker__r.Status__c = 'Active'
            ]) {

                if (!participantFundMap.containsKey(fund.Participant__c)) {
                    participantFundMap.put(fund.Participant__c, new Set<Id>());
                }

                participantFundMap.get(fund.Participant__c)
                    .add(fund.NDIS_Support_Catalogue__c);
            }
        }
                
        // ✅ Query future records
        List<Services_and_Support_Plan__c> futureRecords = [
            SELECT Id,
                Service_Type__c,
                Date_of_Service__c,
                ShiftwithStaff__r.Add_Shift__r.Facility__c
            FROM Services_and_Support_Plan__c
            WHERE ShiftwithStaff__r.Add_Shift__r.Facility__c IN :allFacilityIds
            AND Service_Type__c IN :ndisCatalogueIds
            AND Date_of_Service__c > TODAY
        ];

        // ✅ Store which recordIds have future records
        Set<Id> futureServiceIds = new Set<Id>();

        for (Services_and_Support_Plan__c rec : futureRecords) {
            futureServiceIds.add(rec.Service_Type__c);
        }

        // ✅ Build result for ALL input ids
        // for (Id recId : ndisCatalogueIds) {
          
        //     Map<String, Boolean> status = new Map<String, Boolean>();
        //     status.put('hasFutureShifts', futureServiceIds.contains(recId));
        //     status.put('hasFunds', fundServiceIds.contains(recId));
        //     resultMap.put(recId, status);
        // }
        for (Id recId : ndisCatalogueIds) {

            Map<String, Boolean> status = new Map<String, Boolean>();

            status.put('hasFutureShifts', futureServiceIds.contains(recId));

            Boolean hasFunds = false;

            if (catalogueFacilityMap.containsKey(recId)) {
                for (Id facilityId : catalogueFacilityMap.get(recId)) {
                    if (facilityParticipantMap.containsKey(facilityId)) {
                        for (Id participantId : facilityParticipantMap.get(facilityId)) {
                            if (participantFundMap.containsKey(participantId)
                                && participantFundMap.get(participantId).contains(recId)) {

                                hasFunds = true;
                                break;
                            }
                        }
                    }
                    if (hasFunds) {
                        break;
                    }
                }
            }
            status.put('hasFunds', hasFunds);
            resultMap.put(recId, status);
        }

        System.debug('Result Map: ' + resultMap);
        return resultMap;
    }

    @AuraEnabled
    public static Map<String, Object> getServiceLineItem(String ServiceDate) {
        System.debug('ServiceDate ==> ' + ServiceDate);

        Map<String, Object> response = new Map<String, Object>();
        User objUser = [ SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];

        Id orgId;
        List<Organisation__c> orgNames = [ SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1];
        if (!orgNames.isEmpty()) {
            orgId = orgNames[0].Id;
            System.debug('orgId ==> ' + orgId);
        }

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
                 Support_Item_Number__c,
                // ,Facility__c
                (
                    SELECT Id, Facility__c,Facility__r.Name
                    FROM Service_Catalogues__r
                    WHERE Facility__r.Organisation__c = :orgId
                )
            FROM NDIS_Support_Catalogue__c
            WHERE Start_Date__c = :financialStartDate
        ]) {
            resultMap.put(rec.Id, rec);
        }

        // 🔹 Facility-specific catalogues
        /* for (NDIS_Support_Catalogue__c rec : [
            SELECT Id, Name, Support_Item_Name__c, Start_Date__c,
                ACT__c, NSW__c, NT__c, QLD__c, SA__c, TAS__c, VIC__c, WA__c,
                Facility__c, Support_Item_Number__c
            FROM NDIS_Support_Catalogue__c
            WHERE Facility__c = :recordId
        ]) {
            resultMap.put(rec.Id, rec);
        } */

        // 🔹 Build response
        /* response.put('facility', facility); */
        response.put('catalogues', resultMap.values());

        return response;
    }

     @AuraEnabled
    public static Map<String, Object> getNewServiceTypeLineItem( String financialYear, String industry) {
        System.debug('Financial Year ==> ' + financialYear);


        Map<String, Object> response = new Map<String, Object>();
        User objUser = [ SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];

        Id orgId;
        List<Organisation__c> orgNames = [ SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1];
        if (!orgNames.isEmpty()) {
            orgId = orgNames[0].Id;
            System.debug('orgId ==> ' + orgId);
        }

        //Integer startYear = Integer.valueOf(financialYear.substring(0, 4));
        //Date financialStartDate = Date.newInstance(startYear, 7, 1);

        Map<Id, NDIS_Support_Catalogue__c> resultMap =new Map<Id, NDIS_Support_Catalogue__c>();

        // 🔹 Financial year catalogues
        for (NDIS_Support_Catalogue__c rec : [
            SELECT Id, Name, Support_Item_Name__c, Start_Date__c,Financial_Year__c,
                ACT__c, NSW__c, NT__c, QLD__c, SA__c, TAS__c, VIC__c, WA__c,
                 Support_Item_Number__c,Organization__c
                // ,Facility__c
                // (
                //     SELECT Id, Facility__c,Facility__r.Name
                //     FROM Service_Catalogues__r
                //     WHERE Facility__r.Organisation__c = :orgId
                // )
            FROM NDIS_Support_Catalogue__c
            WHERE Financial_Year__c=:financialYear 
                   //Start_Date__c = :financialStartDate AND 
        ]) {
            resultMap.put(rec.Id, rec);
        }
        for (NDIS_Support_Catalogue__c rec : [
            SELECT Id, Name, Support_Item_Name__c, Start_Date__c,Type_of_Industry__c,Financial_Year__c,
                ACT__c, NSW__c, NT__c, QLD__c, SA__c, TAS__c, VIC__c, WA__c,
                 Support_Item_Number__c,Organization__c
                // ,Facility__c
                // (
                //     SELECT Id, Facility__c,Facility__r.Name
                //     FROM Service_Catalogues__r
                //     WHERE Facility__r.Organisation__c = :orgId
                // )
            FROM NDIS_Support_Catalogue__c
            WHERE Organization__c = :orgId  
            AND  Type_of_Industry__c = :industry         //Start_Date__c = :financialStartDate AND 
        ]) {
            resultMap.put(rec.Id, rec);
        }
        Set<Id> selectedCatalogueIds = new Set<Id>();

        for (Service_Catalogue__c sc : [
            SELECT NDIS_Support_Catalogue__c
            FROM Service_Catalogue__c
            WHERE Organization__c = :orgId 
            AND Financial_Year__c = :financialYear
            AND Type_of_Industry__c = :industry
            AND Active__c = true
        ]) {
            if (sc.NDIS_Support_Catalogue__c != null) {
                selectedCatalogueIds.add(sc.NDIS_Support_Catalogue__c);
            }
        }
       
        // 🔹 Build response
        /* response.put('facility', facility); */
        response.put('catalogues', resultMap.values());
        response.put('selectedCatalogueIds', new List<Id>(selectedCatalogueIds));

        return response;
    }
    
    @AuraEnabled
    public static Map<String,Object> saveServiceCatalogues(String serviceJson) {

        System.debug('Request JSON ==> ' + serviceJson);
        if (String.isBlank(serviceJson)) {
            throw new AuraHandledException('Service data is missing.');
        }
        User objUser = [ SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];

        Id orgId;
        List<Organisation__c> orgNames = [ SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1];
        if (!orgNames.isEmpty()) {
            orgId = orgNames[0].Id;
            System.debug('orgId ==> ' + orgId);
        }
        Integer insertedCount = 0;
        Integer updatedCount = 0;
        Integer skippedCount = 0;
        Map<String, Object> serviceData =(Map<String, Object>) JSON.deserializeUntyped(serviceJson);

        System.debug('serviceData Map ==> ' + serviceData);
        String financialYear = (String)serviceData.get('financialYear');
        String industry      = (String)serviceData.get('industry');
        String serviceType   = (String)serviceData.get('serviceType');
       // String state         = (String)serviceData.get('state');

        List<Object> items = (List<Object>)serviceData.get('items');
        System.debug('Items received = ' + items.size());
        List<Service_Catalogue__c> existingServiceCatalogues = [
            SELECT Id, NDIS_Support_Catalogue__c,Active__c
            FROM Service_Catalogue__c
            WHERE Organization__c = :orgId
            AND Financial_Year__c = :financialYear
            AND Type_of_Industry__c = :industry
        ];

       // Set<Id> existingCatalogueIds = new Set<Id>();
        Map<Id,Service_Catalogue__c> existingMap =new Map<Id,Service_Catalogue__c>();

        for (Service_Catalogue__c sc : existingServiceCatalogues) {
            if (sc.NDIS_Support_Catalogue__c != null) {
               // existingCatalogueIds.add(sc.NDIS_Support_Catalogue__c);
                existingMap.put( sc.NDIS_Support_Catalogue__c, sc);

            }
        }

        //System.debug('Existing Catalogue Ids ==> ' + existingCatalogueIds);
        List<Service_Catalogue__c> upsertList =new List<Service_Catalogue__c>();
        Map<Service_Catalogue__c, Set<Id>> newCatalogueFacilityMap = new Map<Service_Catalogue__c, Set<Id>>();
        Map<Id, Set<Id>> existingCatalogueFacilityMap = new Map<Id, Set<Id>>();

       // List<Service_Catalogue__c> serviceCatalogueList = new List<Service_Catalogue__c>();

        for (Object obj : items) {

            Map<String, Object> item = (Map<String, Object>)obj;

            Id catalogueId = (Id)item.get('catalogueId');
            Boolean isSelected = (Boolean)item.get('isSelected');
            List<Object> facilityList = (List<Object>) item.get('facilityIds');

            Set<Id> facilityIds = new Set<Id>();

           if (facilityList != null && !facilityList.isEmpty()) {
                for (Object f : facilityList) {
                    facilityIds.add((Id)f);
                }
            }
            if (catalogueId == null) {
                continue;
            }
            // if (existingCatalogueIds.contains(catalogueId)) {
            //     System.debug('Duplicate Catalogue Skipped ==> ' + catalogueId);
            //     skippedCount++;
            //     continue;
            // }

        //     Service_Catalogue__c sc = new Service_Catalogue__c();

        //     sc.Organization__c = orgId;
        //     sc.Financial_Year__c = financialYear;
        //     sc.Type_of_Industry__c = industry;
        //    // sc.State__c = state;
        //     sc.NDIS_Support_Catalogue__c = catalogueId;
        //     sc.Active__c = true;
        //     serviceCatalogueList.add(sc);
            if(existingMap.containsKey(catalogueId)){
                Service_Catalogue__c existing =existingMap.get(catalogueId);
                existingCatalogueFacilityMap.put(existing.Id, facilityIds);
                if(existing.Active__c != isSelected){
                    existing.Active__c = isSelected;

                    upsertList.add(existing);

                }  else{
                    skippedCount++;

                }

            }
            else if(isSelected){
                Service_Catalogue__c sc =new Service_Catalogue__c();
                sc.Organization__c = orgId;
                sc.Financial_Year__c = financialYear;
                sc.Type_of_Industry__c = industry;
                sc.NDIS_Support_Catalogue__c = catalogueId;
                sc.Active__c = true;

                upsertList.add(sc);
                newCatalogueFacilityMap.put(sc, facilityIds);
            }  else{
                skippedCount++;

            }

        }
        

        // if (!serviceCatalogueList.isEmpty()) {
        //     insert serviceCatalogueList;
        //     insertedCount = serviceCatalogueList.size();
        // }
        if(!upsertList.isEmpty()){

            Integer newRecordCount = 0;
            Integer existingRecordCount = 0;

            // Count before upsert because newly inserted records
            // receive their Id only after DML.
            for(Service_Catalogue__c sc : upsertList){

                if(sc.Id == null){
                    newRecordCount++;
                }
                else{
                    existingRecordCount++;
                }

            }

            upsert upsertList;
            for (Service_Catalogue__c sc : newCatalogueFacilityMap.keySet()) {

                existingCatalogueFacilityMap.put(
                    sc.Id,
                    newCatalogueFacilityMap.get(sc)
                );

            }

            insertedCount = newRecordCount;
            updatedCount  = existingRecordCount;

        }
        if (!existingCatalogueFacilityMap.isEmpty()) {
            List<Service_Catalogue_Facilty__c> existingFacilities = [
                SELECT Id,
                    Service_Catalogue__c,
                    Facility__c,
                    Active__c
                FROM Service_Catalogue_Facilty__c
                WHERE Service_Catalogue__c IN :existingCatalogueFacilityMap.keySet()
            ];
            Map<Id, Map<Id, Service_Catalogue_Facilty__c>> existingFacilityMap =new Map<Id, Map<Id, Service_Catalogue_Facilty__c>>();

            for (Service_Catalogue_Facilty__c scf : existingFacilities) {

                if (!existingFacilityMap.containsKey(scf.Service_Catalogue__c)) {
                    existingFacilityMap.put(
                        scf.Service_Catalogue__c,
                        new Map<Id, Service_Catalogue_Facilty__c>()
                    );
                }

                existingFacilityMap
                    .get(scf.Service_Catalogue__c)
                    .put(scf.Facility__c, scf);
            }

            List<Service_Catalogue_Facilty__c> facilityUpsertList = new List<Service_Catalogue_Facilty__c>();

            for (Id serviceCatalogueId : existingCatalogueFacilityMap.keySet()) {
                Set<Id> selectedFacilities =existingCatalogueFacilityMap.get(serviceCatalogueId);
                Map<Id, Service_Catalogue_Facilty__c> existing = existingFacilityMap.containsKey(serviceCatalogueId)
                                                                    ? existingFacilityMap.get(serviceCatalogueId)
                                                                    : new Map<Id, Service_Catalogue_Facilty__c>();

                // Insert / Reactivate
                for (Id facilityId : selectedFacilities) {
                    if (existing.containsKey(facilityId)) {
                        Service_Catalogue_Facilty__c scf =existing.get(facilityId);
                        if (!scf.Active__c) {
                            scf.Active__c = true;
                            facilityUpsertList.add(scf);
                        }
                        existing.remove(facilityId);
                    } else {
                        facilityUpsertList.add(
                            new Service_Catalogue_Facilty__c(
                                Service_Catalogue__c = serviceCatalogueId,
                                Facility__c = facilityId,
                                Active__c = true
                            )
                        );
                    }
                }

                // Deactivate removed facilities
                for (Service_Catalogue_Facilty__c scf : existing.values()) {

                    if (scf.Active__c) {
                        scf.Active__c = false;
                        facilityUpsertList.add(scf);
                    }
                }
            }

            if (!facilityUpsertList.isEmpty()) {
                upsert facilityUpsertList;
            }
        }

        Map<String, Object> response = new Map<String, Object>();
        response.put('inserted', insertedCount);
        response.put('skipped', skippedCount);
        response.put('updated', updatedCount);

        return response;
    }

    @AuraEnabled
    public static Map<String, Object> getServiceCatalogues() {

        Map<String, Object> response = new Map<String, Object>();

        User objUser = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
        ];

        Id orgId;

        List<Organisation__c> orgNames = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = :objUser.Organization_Name__c
            LIMIT 1
        ];

        if (!orgNames.isEmpty()) {
            orgId = orgNames[0].Id;
            System.debug('orgId ==> ' + orgId);
        }
        Date todayDate = Date.today();
        Integer startYear;

        if (
            todayDate >= Date.newInstance(todayDate.year(), 7, 1)
        ) {
            startYear = todayDate.year();
        }
        else {
            startYear = todayDate.year() - 1;
        }

        String currentFinancialYear =
            String.valueOf(startYear)
            + '-'
            + String.valueOf(startYear + 1).right(2);

        System.debug('Current Financial Year ==> ' + currentFinancialYear);

        List<Service_Catalogue__c> serviceCatalogues = [
            SELECT
                Id,Name,
                Financial_Year__c,
                Type_of_Industry__c,
                Active__c,
                Organization__c,
                Organization__r.Name,

                NDIS_Support_Catalogue__c,
                NDIS_Support_Catalogue__r.Id,
                NDIS_Support_Catalogue__r.Name,
                NDIS_Support_Catalogue__r.Support_Item_Name__c,
                NDIS_Support_Catalogue__r.Support_Item_Number__c,
                NDIS_Support_Catalogue__r.ACT__c,
                NDIS_Support_Catalogue__r.NSW__c,
                NDIS_Support_Catalogue__r.NT__c,
                NDIS_Support_Catalogue__r.QLD__c,
                NDIS_Support_Catalogue__r.SA__c,
                NDIS_Support_Catalogue__r.TAS__c,
                NDIS_Support_Catalogue__r.VIC__c,
                NDIS_Support_Catalogue__r.WA__c,
                NDIS_Support_Catalogue__r.Organization__c,
                (
                    SELECT
                        Id,
                        Facility__c,
                        Facility__r.Name
                    FROM Service_Catalogue_Facilities__r
                    WHERE Active__c = true
                )

            FROM Service_Catalogue__c
            WHERE Organization__c = :orgId
            AND Financial_Year__c = :currentFinancialYear
            AND Active__c = true
            
        ];
        Map<String, Service_Catalogue__c> uniqueMap = new Map<String, Service_Catalogue__c>();
        for (Service_Catalogue__c sc : serviceCatalogues) {

            String key =
                String.valueOf(sc.Organization__c) + '|' +
                String.valueOf(sc.Financial_Year__c) + '|' +
                String.valueOf(sc.Type_of_Industry__c) + '|' +
                String.valueOf(sc.NDIS_Support_Catalogue__c);

            if (!uniqueMap.containsKey(key)) {
                uniqueMap.put(key, sc);
            }
        }

       // response.put('catalogues', serviceCatalogues);
       response.put('catalogues', uniqueMap.values());
        return response;
    }

    @AuraEnabled
    public static void saveServiceCatalogueFacilities(String facilityJson) {

        System.debug('Facility Payload ==> ' + facilityJson);
        if(String.isBlank(facilityJson)){
            throw new AuraHandledException('Facility data is missing.');
        }

        List<Object> requestList = (List<Object>)JSON.deserializeUntyped(facilityJson);
        if(requestList.isEmpty()){
            return;
        }
        Set<Id> serviceCatalogueIds = new Set<Id>();

        for(Object obj : requestList){
            Map<String,Object> row =(Map<String,Object>)obj;
            Id serviceCatalogueId =(Id)row.get('serviceCatalogueId');

            if (serviceCatalogueId != null) {
                serviceCatalogueIds.add(serviceCatalogueId);
            }
        }

        List<Service_Catalogue_Facilty__c> existingMappings = [
            SELECT
                Id,
                Service_Catalogue__c,
                Facility__c,
                Active__c
            FROM Service_Catalogue_Facilty__c
            WHERE Service_Catalogue__c IN :serviceCatalogueIds 
        ];

        Map<Id,Map<Id,Service_Catalogue_Facilty__c>> existingMap = new Map<Id,Map<Id,Service_Catalogue_Facilty__c>>();

        for(Service_Catalogue_Facilty__c rec : existingMappings){
            if(!existingMap.containsKey(rec.Service_Catalogue__c)){
                existingMap.put(
                    rec.Service_Catalogue__c,
                    new Map<Id,Service_Catalogue_Facilty__c>()
                );

            }
            existingMap
                .get(rec.Service_Catalogue__c)
                .put(rec.Facility__c,rec);

        }
        List<Service_Catalogue_Facilty__c> recordsToSave =new List<Service_Catalogue_Facilty__c>();

        for(Object obj : requestList){

            Map<String,Object> row =(Map<String,Object>)obj;
            Id serviceCatalogueId = (Id)row.get('serviceCatalogueId');
            List<Object> selectedFacilities =(List<Object>)row.get('facilityIds');
            Set<Id> selectedSet = new Set<Id>();

            if(selectedFacilities != null){
                for(Object facilityObj : selectedFacilities){
                    selectedSet.add((Id)facilityObj);
                }
            }

            Map<Id,Service_Catalogue_Facilty__c> dbFacilities =
                existingMap.containsKey(serviceCatalogueId)
                ? existingMap.get(serviceCatalogueId)
                : new Map<Id,Service_Catalogue_Facilty__c>();

            // Existing Records
            for(Id facilityId : dbFacilities.keySet()){
                Service_Catalogue_Facilty__c rec =
                    dbFacilities.get(facilityId);
                if(selectedSet.contains(facilityId)){
                    if(!rec.Active__c){
                        rec.Active__c = true;
                        recordsToSave.add(rec);
                    }
                    selectedSet.remove(facilityId);
                }
                else{
                    if(rec.Active__c){
                        rec.Active__c = false;
                        recordsToSave.add(rec);
                    }
                }
            }

            // New Records
            for(Id facilityId : selectedSet){
                recordsToSave.add(
                    new Service_Catalogue_Facilty__c(
                        Service_Catalogue__c = serviceCatalogueId,
                        Facility__c = facilityId,
                        Active__c = true
                    )
                );
            }
        }

        if(!recordsToSave.isEmpty()){
            upsert recordsToSave;
        }
    }
    
     @AuraEnabled
    public static Map<String, Boolean> handleFacilityUncheck(
        Id facilityId,
        List<Id> serviceCatalogueIds
    ) {

        System.debug('===== handleFacilityUncheck START =====');
        System.debug('Facility Id : ' + facilityId);
        System.debug('Service Catalogue Ids : ' + serviceCatalogueIds);
        Map<String, Boolean> result = new Map<String, Boolean>();

        if (facilityId == null || serviceCatalogueIds == null || serviceCatalogueIds.isEmpty()) {
            
            result.put('hasFutureShifts', false);
            result.put('hasFunds', false);
            return result;
        }

        Set<Id> ndisCatalogueIds = new Set<Id>();

        for (Service_Catalogue__c sc : [
            SELECT NDIS_Support_Catalogue__c
            FROM Service_Catalogue__c
            WHERE Id IN :serviceCatalogueIds
            AND NDIS_Support_Catalogue__c != null
        ]) {
            ndisCatalogueIds.add(sc.NDIS_Support_Catalogue__c);
        }
        if (ndisCatalogueIds.isEmpty()) {
            result.put('hasFutureShifts', false);
            result.put('hasFunds', false);
            return result;
        }
        // Integer fundCount = [
        //     SELECT COUNT()
        //     FROM ClientFundTrackerJN__c
        //     WHERE NDIS_Support_Catalogue__c IN :ndisCatalogueIds
        // ];
        Set<Id> participantIds = new Set<Id>();

        for (Participant_Facility__c pf : [
            SELECT Participant__c
            FROM Participant_Facility__c
            WHERE Facility__c = :facilityId
            AND Active__c=true
            AND Participant__c != null

        ]) {
            participantIds.add(pf.Participant__c);
        }

        if (participantIds.isEmpty()) {
            result.put('hasFunds', false);
        } else {
            Integer fundCount = [
                SELECT COUNT()
                FROM ClientFundTrackerJN__c
                WHERE Participant__c IN :participantIds
                AND Funds_Tracker__r.Status__c = 'Active'
                AND NDIS_Support_Catalogue__c IN :ndisCatalogueIds
            ];

            result.put('hasFunds', fundCount > 0);
        }

        Integer futureShiftCount = [
            SELECT COUNT()
            FROM Services_and_Support_Plan__c
            WHERE ShiftwithStaff__r.Add_Shift__r.Facility__c = :facilityId
            AND Service_Type__c IN :ndisCatalogueIds
            AND Date_of_Service__c > TODAY
        ];

        System.debug('Future Shift Count : ' + futureShiftCount);
        result.put('hasFutureShifts', futureShiftCount > 0);
        //result.put('hasFunds', fundCount > 0);

        return result;
    }

    @AuraEnabled
    public static Map<Id, Map<String, Boolean>> processBulkFacilityUncheck(
        List<Id> facilityIds,
        List<Id> serviceCatalogueIds
    ) {
        System.debug('===== processBulkFacilityUncheck START =====');
        System.debug('Facility Ids : ' + facilityIds);
        System.debug('Service Catalogue Ids : ' + serviceCatalogueIds);

        Map<Id, Map<String, Boolean>> resultMap =new Map<Id, Map<String, Boolean>>();
        if (facilityIds == null || facilityIds.isEmpty() || serviceCatalogueIds == null ||
            serviceCatalogueIds.isEmpty()) {
            return resultMap;
        }
        Set<Id> ndisCatalogueIds = new Set<Id>();
        for (Service_Catalogue__c sc : [
            SELECT NDIS_Support_Catalogue__c
            FROM Service_Catalogue__c
            WHERE Id IN :serviceCatalogueIds
            AND NDIS_Support_Catalogue__c != null
        ]) {
            ndisCatalogueIds.add(sc.NDIS_Support_Catalogue__c);
        }

        if (ndisCatalogueIds.isEmpty()) {
            for (Id facilityId : facilityIds) {
                Map<String, Boolean> status = new Map<String, Boolean>();
                status.put('hasFutureShifts', false);
                status.put('hasFunds', false);

                resultMap.put(facilityId, status);
            }
            return resultMap;
        }

       Map<Id, Set<Id>> facilityParticipantMap = new Map<Id, Set<Id>>();
        Set<Id> participantIds = new Set<Id>();

        for (Participant_Facility__c pf : [
            SELECT Facility__c, Participant__c
            FROM Participant_Facility__c
            WHERE Facility__c IN :facilityIds
            AND Active__c = true
            AND Participant__c != null

        ]) {
            participantIds.add(pf.Participant__c);

            if (!facilityParticipantMap.containsKey(pf.Facility__c)) {
                facilityParticipantMap.put(pf.Facility__c, new Set<Id>());
            }

            facilityParticipantMap.get(pf.Facility__c).add(pf.Participant__c);
        }

        // Find participants who have ACTIVE funds for the selected support items
        Set<Id> participantsWithFunds = new Set<Id>();

        if (!participantIds.isEmpty()) {
            for (ClientFundTrackerJN__c fund : [
                SELECT Participant__c
                FROM ClientFundTrackerJN__c
                WHERE Participant__c IN :participantIds
                AND NDIS_Support_Catalogue__c IN :ndisCatalogueIds
                AND Funds_Tracker__r.Status__c = 'Active'
            ]) {
                participantsWithFunds.add(fund.Participant__c);
            }
        }
        //Boolean hasFunds = !fundServiceIds.isEmpty();

        List<Services_and_Support_Plan__c> futureRecords = [
            SELECT Id,
                Service_Type__c,
                Date_of_Service__c,
                ShiftwithStaff__r.Add_Shift__r.Facility__c
            FROM Services_and_Support_Plan__c
            WHERE ShiftwithStaff__r.Add_Shift__r.Facility__c IN :facilityIds
            AND Service_Type__c IN :ndisCatalogueIds
            AND Date_of_Service__c > TODAY
        ];

        Set<Id> futureFacilityIds = new Set<Id>();
        for (Services_and_Support_Plan__c rec : futureRecords) {
            futureFacilityIds.add(
                rec.ShiftwithStaff__r.Add_Shift__r.Facility__c
            );
        }

        for (Id facilityId : facilityIds) {
            Map<String, Boolean> status = new Map<String, Boolean>();

            status.put(
                'hasFutureShifts',
                futureFacilityIds.contains(facilityId)
            );
           // status.put( 'hasFunds',hasFunds);

            Boolean facilityHasFunds = false;

            if (facilityParticipantMap.containsKey(facilityId)) {
                for (Id participantId : facilityParticipantMap.get(facilityId)) {
                    if (participantsWithFunds.contains(participantId)) {
                        facilityHasFunds = true;
                        break;
                    }
                }
            }

            status.put('hasFunds', facilityHasFunds);
            resultMap.put(facilityId, status);
        }

        System.debug('Result Map : ' + resultMap);
        return resultMap;
    }
}