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
    public static void processBulkSelectedRecords(Id facilityId, String selectedRecordsJson ) {
        System.debug('FacilityId ==> ' + facilityId);

        List<Object> records =
            (List<Object>) JSON.deserializeUntyped(selectedRecordsJson);

        Facility__c facility = [
            SELECT Id, Type_of_Service__c
            FROM Facility__c
            WHERE Id = :facilityId
            LIMIT 1
        ];

        List<Service_Catalogue__c> toInsert = new List<Service_Catalogue__c>();
        List<Service_Catalogue__c> toUpdate = new List<Service_Catalogue__c>();

        for (Object obj : records) {
            Map<String, Object> recordMap = (Map<String, Object>) obj;

            Id catalogueId = (Id) recordMap.get('Id');
            Id serviceCatalogueId = (Id) recordMap.get('serviceCatalogueId');
            Boolean isSelected = (Boolean) recordMap.get('isSelected');

            // 🔁 UPDATE
            if (serviceCatalogueId != null) {
                toUpdate.add(new Service_Catalogue__c(
                    Id = serviceCatalogueId,
                    Active__c = isSelected
                ));
                continue;
            }

            // ➕ INSERT only if selected
            if (isSelected) {
                Service_Catalogue__c sc = new Service_Catalogue__c();
                sc.Facility__c = facilityId;
                sc.Active__c = true;
                sc.NDIS_Support_Catalogue__c = catalogueId;

                toInsert.add(sc);
            }
        }

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

}