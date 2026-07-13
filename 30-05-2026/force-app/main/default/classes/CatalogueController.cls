public with sharing class CatalogueController {

    @AuraEnabled
    public static void saveCatalogue(Id recordId, String formDataJson) {

        System.debug('recordId ==> ' + recordId);
        System.debug('formDataJson ==> ' + formDataJson);

        // 1️⃣ Query Facility
        Facility__c facility = [
            SELECT Id, Name, Type_of_Service__c
            FROM Facility__c
            WHERE Id = :recordId
            LIMIT 1
        ];

        // 2️⃣ Deserialize form data
        Map<String, Object> formData =
            (Map<String, Object>) JSON.deserializeUntyped(formDataJson);

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

        ndisCatalogue.Facility__c = facility.Id;
        mapCommonFields(ndisCatalogue, formData);

        // ✅ UPSERT (Insert or Update)
        upsert ndisCatalogue;
    }

    public static void mapCommonFields(SObject catalogue, Map<String, Object> formData) {

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
    public static Map<Id, List<Service_Catalogue__c>> getServiceCataloguesByClient(Id clientId) {

        Map<Id, List<Service_Catalogue__c>> facilityToCatalogues =
            new Map<Id, List<Service_Catalogue__c>>();

        if (clientId == null) {
            return facilityToCatalogues;
        }

        // 1️⃣ Collect Facility Ids from Participant Facilities
        Set<Id> facilityIds = new Set<Id>();

        Client__c clientRec = [
            SELECT
                Id,
                (
                    SELECT Id, Facility__c
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
            }
        }

        if (facilityIds.isEmpty()) {
            return facilityToCatalogues;
        }

        // 2️⃣ Query Service_Catalogue__c including parent NDIS Support Catalogue Name
        List<Service_Catalogue__c> catalogues = [
            SELECT
                Id,
                Name,
                Facility__c,
                Active__c,
                NDIS_Support_Catalogue__c,
                NDIS_Support_Catalogue__r.Name
            FROM Service_Catalogue__c
            WHERE Facility__c IN :facilityIds 
            AND Active__c = true
        ];

        // 3️⃣ Build Facility → Service Catalogue map
        for (Service_Catalogue__c sc : catalogues) {

            if (!facilityToCatalogues.containsKey(sc.Facility__c)) {
                facilityToCatalogues.put(sc.Facility__c, new List<Service_Catalogue__c>());
            }

            facilityToCatalogues.get(sc.Facility__c).add(sc);
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

    @AuraEnabled
    public static List<Services_and_Support_Plan__c> handleUncheck(Id facilityId, Id recordId) {

        System.debug('===== handleUncheck START =====');

        // 🔹 Input Parameters
        System.debug('➡️ Input facilityId: ' + facilityId);
        System.debug('➡️ Input recordId (Service Type): ' + recordId);

        // 🔹 Null checks
        if (facilityId == null) {
            System.debug('⚠️ facilityId is NULL');
        } else {
            System.debug('✅ facilityId is NOT NULL');
        }

        if (recordId == null) {
            System.debug('⚠️ recordId is NULL');
        } else {
            System.debug('✅ recordId is NOT NULL');
        }

        // 🔹 Current date context
        System.debug('📅 Today (System.today): ' + System.today());
        System.debug('📅 Now (System.now): ' + System.now());

        // 🔹 About to run SOQL
        System.debug('🔍 Executing SOQL query for future Services_and_Support_Plan__c records...');

        List<Services_and_Support_Plan__c> futureRecords = [
            SELECT Id,
                Client__c,
                Service_Type__c,
                Date_of_Service__c,
                ShiftwithStaff__r.Add_Shift__r.Facility__c
            FROM Services_and_Support_Plan__c
            WHERE ShiftwithStaff__r.Add_Shift__r.Facility__c = :facilityId
            AND Service_Type__c = :recordId
            AND Date_of_Service__c > TODAY
        ];

        System.debug('🔍 SOQL query executed');

        // 🔹 Result count
        Integer recordCount = futureRecords.size();
        System.debug('📊 Future Records Count: ' + recordCount);

        // 🔹 Detailed record output (safe for small lists)
        if (recordCount > 0) {

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

        System.debug('===== handleUncheck END =====');

        return futureRecords;
    }

    @AuraEnabled
    public static Map<Id, Boolean> processBulkSelectedRecordsUncheck(Id facilityId, List<Id> recordIds) {

        System.debug('FacilityId: ' + facilityId);
        System.debug('RecordIds: ' + recordIds);

        Map<Id, Boolean> resultMap = new Map<Id, Boolean>();

        // ✅ Query future records
        List<Services_and_Support_Plan__c> futureRecords = [
            SELECT Service_Type__c
            FROM Services_and_Support_Plan__c
            WHERE ShiftwithStaff__r.Add_Shift__r.Facility__c = :facilityId
            AND Service_Type__c IN :recordIds
            AND Date_of_Service__c > TODAY
        ];

        // ✅ Store which recordIds have future records
        Set<Id> futureServiceIds = new Set<Id>();

        for (Services_and_Support_Plan__c rec : futureRecords) {
            futureServiceIds.add(rec.Service_Type__c);
        }

        // ✅ Build result for ALL input ids
        for (Id recId : recordIds) {
            if (futureServiceIds.contains(recId)) {
                resultMap.put(recId, true);  // has future records
            } else {
                resultMap.put(recId, false); // no future records
            }
        }

        System.debug('Result Map: ' + resultMap);

        return resultMap;
    }

}