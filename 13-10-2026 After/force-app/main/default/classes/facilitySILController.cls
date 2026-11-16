public with sharing class facilitySILController {

    /* ═══════════════════════════════════════════════════════════
       fetchActiveParticipants
       Returns active clients for the given facility as label/value pairs.
    ═══════════════════════════════════════════════════════════ */
    @AuraEnabled
    public static List<SelectOptionWrapper> fetchActiveParticipants(Id facilityId) {
        List<SelectOptionWrapper> options = new List<SelectOptionWrapper>();
        for (Client__c c : [
            SELECT Id, Name__c
            FROM Client__c
            WHERE  Id IN (
                                   SELECT Participant__c
                                   FROM Participant_Facility__c
                                   WHERE Facility__c = :facilityId
                                   AND Active__c = true
                               )
              AND Status__c = true
            ORDER BY Name__c
        ]) {
            options.add(new SelectOptionWrapper(c.Id, c.Name__c));
        }
        return options;
    }

    public class SelectOptionWrapper {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        public SelectOptionWrapper(String value, String label) {
            this.value = value;
            this.label = label;
        }
    }

    /* ═══════════════════════════════════════════════════════════
       fetchServiceTypes
       Returns distinct NDIS catalogue names as a string list.
    ═══════════════════════════════════════════════════════════ */
    @AuraEnabled
    public static List<String> fetchServiceTypes() {
        List<String> serviceTypes = new List<String>();
        for (AggregateResult ar : [
            SELECT Name
            FROM NDIS_Support_Catalogue__c
            WHERE Support_Category_Name__c LIKE '%SIL%'
            GROUP BY Name
            ORDER BY Name
        ]) {
            serviceTypes.add((String) ar.get('Name'));
        }
        return serviceTypes;
    }

    // @AuraEnabled
    // public static List<String> fetchServiceTypes(Id facilityId) {
    //     List<String> serviceTypes = new List<String>();
    //     System.debug('Facility Id : ' + facilityId);
    //     if (facilityId == null) {
    //         System.debug('Facility Id is NULL');
    //         return serviceTypes;
    //     }
    //     Date today = Date.today();
    //     Integer startYear = (today.month() < 7)
    //         ? today.year() - 1
    //         : today.year();
    //     System.debug('startYear : ' + startYear);
    //     String financialYear =startYear + '-' + String.valueOf(startYear + 1).right(2);

    //     System.debug('Financial Year : ' + financialYear);
    //     // Facility__c facility = [
    //     //     SELECT Type_of_Service__c
    //     //     FROM Facility__c
    //     //     WHERE Id = :facilityId
    //     //     LIMIT 1
    //     // ];
    //     List<Facility__c> facilities = [
    //         SELECT Id,
    //             Name,
    //             Type_of_Service__c
    //         FROM Facility__c
    //         WHERE Id = :facilityId
    //         LIMIT 1
    //     ];

    //     if (facilities.isEmpty()) {
    //         System.debug('No Facility found for Id : ' + facilityId);
    //         return serviceTypes;
    //     }

    //     Facility__c facility = facilities[0];

    //     System.debug('Facility Record : ' + facility);
    //     System.debug('Facility Name : ' + facility.Name);
    //     System.debug('Industry Type : ' + facility.Type_of_Service__c);

    //     if (String.isBlank(facility.Type_of_Service__c)) {
    //         System.debug('Industry Type is blank.');
    //         return serviceTypes;
    //     }
    //     List<Service_Catalogue_Facilty__c> junctions = [
    //         SELECT Service_Catalogue__c
    //         FROM Service_Catalogue_Facilty__c
    //         WHERE Active__c = true
    //         AND Facility__c = :facilityId
    //     ];

    //     System.debug('Junction Records : ' + junctions);
    //     if (junctions.isEmpty()) {
    //         System.debug('No Junction records found.');
    //         return serviceTypes;
    //     }

    //     Set<Id> serviceCatalogueIds = new Set<Id>();

    //     for (Service_Catalogue_Facilty__c j : junctions) {
    //         serviceCatalogueIds.add(j.Service_Catalogue__c);
    //     }

    //     System.debug('Service Catalogue Ids : ' + serviceCatalogueIds);
    //     List<Service_Catalogue__c> catalogues = [
    //         SELECT Id,
    //             Name,
    //             NDIS_Support_Catalogue__r.Name,
    //             Financial_Year__c,
    //             Type_of_Industry__c
    //         FROM Service_Catalogue__c
    //         WHERE Id IN :serviceCatalogueIds
    //         AND Active__c = true
    //         AND Financial_Year__c = :financialYear
    //         AND Type_of_Industry__c = :facility.Type_of_Service__c
    //         ORDER BY Name
    //     ];

    //     System.debug('Filtered Service Catalogues : ' + catalogues);

    //     Set<String> serviceTypeSet = new Set<String>();

    //     for (Service_Catalogue__c sc : catalogues) {
    //         if (sc.NDIS_Support_Catalogue__r != null &&
    //             !String.isBlank(sc.NDIS_Support_Catalogue__r.Name)) {

    //             serviceTypeSet.add(sc.NDIS_Support_Catalogue__r.Name);
    //         }
    //     }

    //     serviceTypes.addAll(serviceTypeSet);
    //     serviceTypes.sort();

    //     System.debug('Service Types Found : ' + serviceTypes);
    //     System.debug('Total Service Types : ' + serviceTypes.size());
    //     return serviceTypes;
    // }


    /* ═══════════════════════════════════════════════════════════
       fetchParticipantNDISCatalogue
       Returns NDIS catalogue rows filtered by service type + FY.
    ═══════════════════════════════════════════════════════════ */
@AuraEnabled
public static List<NDIS_Support_Catalogue__c> fetchParticipantNDISCatalogue(
    String serviceType,
    Date   serviceDate
) {
    if (String.isBlank(serviceType)) return new List<NDIS_Support_Catalogue__c>();

    Date    sDate       = serviceDate != null ? serviceDate : Date.today();
    Integer year        = sDate.year();
    Integer fyStartYear = sDate < Date.newInstance(year, 7, 1) ? year - 1 : year;
    Date    fyStart     = Date.newInstance(fyStartYear, 7, 1);

    return [
        SELECT Id, Name,Is_Government__c,
               Support_Item_Name__c, Support_Item_Number__c,
               ACT__c, NSW__c, VIC__c, QLD__c,
               WA__c,  SA__c,  TAS__c, NT__c
        FROM NDIS_Support_Catalogue__c
        WHERE Name                     = :serviceType        // ← match what dropdown returns
          AND Support_Category_Name__c LIKE '%SIL%'         // ← restrict to SIL only
          AND Start_Date__c            = :fyStart
        ORDER BY Support_Item_Name__c
    ];
}

    /* ═══════════════════════════════════════════════════════════
       fetchSILRecords  ← NEW
       Returns all active SIL records for the given facility,
       with participant name resolved via relationship.
    ═══════════════════════════════════════════════════════════ */
/*     @AuraEnabled
    public static List<SIL__c> fetchSILRecords(Id facilityId) {
        return [
            SELECT Id,
                   SIL_To_Participant__r.Name__c,
                   Entity_Name__c,
                   ServiceType__c,
                   Amount__c,
                   StartDate__c,
                   EndDate__c,
                   InvoiceDate__c,
                   Status__c
            FROM SIL__c
            WHERE SIL_To_Facility__c = :facilityId
            ORDER BY CreatedDate DESC
        ];
    } */
@AuraEnabled
public static Map<String, Object> fetchSILRecords(
    Id facilityId,
    Integer limitSize,
    Integer offsetVal
) {

    List<SIL__c> records = [
        SELECT Id,
               SIL_To_Participant__r.Name__c,
               Entity_Name__c,
               ServiceType__c,
               Amount__c,
               StartDate__c,
               EndDate__c,
               InvoiceDay__c,
               InvoiceAmount__c,
               Remaining_Amount__c,
               Spent_Amount__c,  
               Status__c
        FROM SIL__c
        WHERE SIL_To_Facility__c = :facilityId
        ORDER BY CreatedDate DESC
        LIMIT :limitSize
        OFFSET :offsetVal
    ];

    Integer totalCount = [
        SELECT COUNT()
        FROM SIL__c
        WHERE SIL_To_Facility__c = :facilityId
    ];

    return new Map<String, Object>{
        'records' => records,
        'total'   => totalCount
    };
}
    /* ═══════════════════════════════════════════════════════════
       saveSIL
       Creates SIL__c (parent) + SIL_Items__c (child) from JSON.
    ═══════════════════════════════════════════════════════════ */
 @AuraEnabled
public static Id saveSIL(String requestJson) {
    if (String.isBlank(requestJson)) {
        throw new AuraHandledException('Invalid request');
    }

    SILRequestWrapper req =
        (SILRequestWrapper) JSON.deserialize(requestJson, SILRequestWrapper.class);

    // Validate only for insert
    if (req.silId == null) {
        validateRequest(req);
    }

    try {
        // ── UPSERT SIL ──
        SIL__c sil = new SIL__c(
            Id                    = req.silId,
            Amount__c             = req.amount,
            StartDate__c          = req.startDate,
            EndDate__c            = req.endDate,
            Frequency__c          = req.frequency,
            InvoiceDay__c         = req.invoiceDay,
            InvoiceAmount__c      = req.invoiceAmount,
            Plan_Type__c          = req.planType,
            ServiceType__c        = req.serviceType,
            State__c              = req.state,
             Entity_Profile__c     = req.entityId,
            Entity_Name__c        = req.entityName,
            SIL_To_Facility__c    = req.facilityId,
            SIL_To_Participant__c = req.participantId
           // Status__c             = 'Active'
        );
        /* if (req.silId == null) {
            sil.Status__c = 'Active';
            sil.Remaining_Amount__c = req.amount;
            sil.Spent_Amount__c = 0;
        } */
       if (req.silId == null) {
    // ✅ INSERT
    sil.Status__c = 'Active';
    sil.Spent_Amount__c = 0;
    sil.Remaining_Amount__c = req.amount;
} else {
    // ✅ UPDATE (CRITICAL FIX)

    SIL__c existing = [
        SELECT Spent_Amount__c, Amount__c, Status__c
        FROM SIL__c
        WHERE Id = :req.silId
        LIMIT 1
    ];

    Decimal spent = existing.Spent_Amount__c != null ? existing.Spent_Amount__c : 0;

    // ❌ Prevent invalid reduction
    if (req.amount < spent) {
        throw new AuraHandledException('Amount cannot be less than already spent amount');
    }

    // ✅ Lock spent (DO NOT TRUST UI)
    sil.Spent_Amount__c = spent;

    // ✅ Recalculate remaining
    sil.Remaining_Amount__c = req.amount - spent;

    // ✅ Re-activate if needed
    if (sil.Remaining_Amount__c > 0) {
        sil.Status__c = 'Active';
    }
}
        upsert sil;

        // ── HANDLE ITEMS ──
        if (req.selectedItems != null && !req.selectedItems.isEmpty()) {

            // 🔁 EDIT MODE
           /*  if (req.silId != null) {

                List<SIL_Items__c> existingItems = [
                    SELECT Id, SILItem_To_NDIS_Support_Catalogue__c
                    FROM SIL_Items__c
                    WHERE SILItems_To_SIL__c = :sil.Id
                    AND State__c = :req.state
                    AND Status__c = true
                ];

                // Existing IDs
                Set<Id> existingIds = new Set<Id>();
                for (SIL_Items__c item : existingItems) {
                    existingIds.add(item.SILItem_To_NDIS_Support_Catalogue__c);
                }

                // New selected IDs
                Set<Id> newSelectedIds = new Set<Id>();
                for (SelectedItemWrapper item : req.selectedItems) {
                    newSelectedIds.add(item.catalogueId);
                }

                // ❌ Deactivate unchecked items
                List<SIL_Items__c> toDeactivate = new List<SIL_Items__c>();
                for (SIL_Items__c item : existingItems) {
                    if (!newSelectedIds.contains(item.SILItem_To_NDIS_Support_Catalogue__c)) {
                        item.Status__c = false;
                        toDeactivate.add(item);
                    }
                }

                // 🆕 Insert new items
                List<SIL_Items__c> toInsert = new List<SIL_Items__c>();
                for (SelectedItemWrapper item : req.selectedItems) {
                    if (!existingIds.contains(item.catalogueId)) {
                        toInsert.add(new SIL_Items__c(
                            SILItems_To_SIL__c = sil.Id,
                            SILItem_To_NDIS_Support_Catalogue__c = item.catalogueId,
                            SupportItem_Number__c = item.supportItemNumber,
                            SupportItem_Name__c = item.supportItemName,
                            State__c = req.state,
                            Status__c = true
                        ));
                    }
                }

                if (!toDeactivate.isEmpty()) update toDeactivate;
                if (!toInsert.isEmpty()) insert toInsert;
            }
 */
          if (req.silId != null) {

    // ✅ Fetch ALL items (active + inactive)
    Map<Id, SIL_Items__c> existingMap = new Map<Id, SIL_Items__c>();

    for (SIL_Items__c item : [
        SELECT Id, SILItem_To_NDIS_Support_Catalogue__c, Status__c
        FROM SIL_Items__c
        WHERE SILItems_To_SIL__c = :sil.Id
        AND State__c = :req.state
    ]) {
        existingMap.put(item.SILItem_To_NDIS_Support_Catalogue__c, item);
    }

    // New selected IDs
    Set<Id> newSelectedIds = new Set<Id>();
    for (SelectedItemWrapper item : req.selectedItems) {
        newSelectedIds.add(item.catalogueId);
    }

    List<SIL_Items__c> toDeactivate = new List<SIL_Items__c>();
    List<SIL_Items__c> toInsert     = new List<SIL_Items__c>();
    List<SIL_Items__c> toUpdate     = new List<SIL_Items__c>();

    // ❌ Deactivate unchecked
    for (SIL_Items__c item : existingMap.values()) {
        if (!newSelectedIds.contains(item.SILItem_To_NDIS_Support_Catalogue__c)
            && item.Status__c == true) {

            item.Status__c = false;
            toDeactivate.add(item);
        }
    }

    // ✅ Handle selected items
    for (SelectedItemWrapper item : req.selectedItems) {

        if (existingMap.containsKey(item.catalogueId)) {

            SIL_Items__c existing = existingMap.get(item.catalogueId);

            // 🔁 Reactivate if inactive
            if (existing.Status__c == false) {
                existing.Status__c = true;
                toUpdate.add(existing);
            }

        } else {

            // 🆕 Truly new record
            toInsert.add(new SIL_Items__c(
                SILItems_To_SIL__c = sil.Id,
                SILItem_To_NDIS_Support_Catalogue__c = item.catalogueId,
                SupportItem_Number__c = item.supportItemNumber,
                SupportItem_Name__c = item.supportItemName,
                State__c = req.state,
                Status__c = true
            ));
        }
    }

    if (!toDeactivate.isEmpty()) update toDeactivate;
    if (!toUpdate.isEmpty())     update toUpdate;
    if (!toInsert.isEmpty())     insert toInsert;
}
            // 🟢 INSERT MODE (NEW RECORD)
            else {

                List<SIL_Items__c> toInsert = new List<SIL_Items__c>();

                for (SelectedItemWrapper item : req.selectedItems) {
                    toInsert.add(new SIL_Items__c(
                        SILItems_To_SIL__c = sil.Id,
                        SILItem_To_NDIS_Support_Catalogue__c = item.catalogueId,
                        SupportItem_Number__c = item.supportItemNumber,
                        SupportItem_Name__c = item.supportItemName,
                        State__c = req.state,
                        Status__c = true
                    ));
                }

                if (!toInsert.isEmpty()) {
                    insert toInsert;
                }
            }
        }

        return sil.Id;

    } catch (Exception e) {
        throw new AuraHandledException('Error saving SIL: ' + e.getMessage());
    }
}
    /* ── Inner wrapper classes ──────────────────────────────────── */
    public class SILRequestWrapper {
        public Id      silId;
        public String  name;
        public Decimal amount;
        public Date    startDate;
        public Date    endDate;
        public String  frequency;
        public String    invoiceDay;
        public Decimal invoiceAmount;
        public String  planType;
        public String  serviceType;
        public String  state;
        public String  entityName;
        public Id      facilityId;
        public Id      participantId;
        public Id entityId;
        // public SelectedItemWrapper selectedItem;
        public List<SelectedItemWrapper> selectedItems;
    }

    public class SelectedItemWrapper {
        public Id     catalogueId;
        public String serviceName;
        public String supportItemNumber;
        public String supportItemName;
    }

    /* ── Validation ─────────────────────────────────────────────── */
    private static void validateRequest(SILRequestWrapper req) {
        if (req.facilityId    == null) throw new AuraHandledException('Facility is required');
        if (req.participantId == null) throw new AuraHandledException('Participant is required');
        if (String.isBlank(req.serviceType)) throw new AuraHandledException('Service Type is required');
        if (String.isBlank(req.state))       throw new AuraHandledException('State is required');
        if (req.startDate == null || req.endDate == null)
            throw new AuraHandledException('Start and End Date are required');
        /* if (req.selectedItem == null)
            throw new AuraHandledException('Please select a service item'); */
        if (req.selectedItems == null || req.selectedItems.isEmpty())
           throw new AuraHandledException('Please select at least one service item');
         }

    @AuraEnabled
public static SILWrapper fetchSILRecordById(Id silId, String state) {

    SIL__c sil = [
        SELECT Id,
               Entity_Name__c,
               ServiceType__c,
               Amount__c,
               Remaining_Amount__c,
               Spent_Amount__c, 
               StartDate__c,
               EndDate__c,
               InvoiceDay__c,
               InvoiceAmount__c,
               Frequency__c,
               Plan_Type__c,
               State__c,
               SIL_To_Participant__c
        FROM SIL__c
        WHERE Id = :silId
        LIMIT 1
    ];

List<SIL_Items__c> items = [
    SELECT Id,
           SILItem_To_NDIS_Support_Catalogue__c,
           SupportItem_Name__c,
           SupportItem_Number__c
    FROM SIL_Items__c
    WHERE SILItems_To_SIL__c = :silId
      AND Status__c = true
      AND State__c = :state   // ✅ ADD THIS
];

    return new SILWrapper(sil, items);
}

public class SILWrapper {
    @AuraEnabled public SIL__c sil;
    @AuraEnabled public List<SIL_Items__c> items;

    public SILWrapper(SIL__c sil, List<SIL_Items__c> items) {
    this.sil = sil;
    this.items = items;
    }
}

@AuraEnabled
public static void updateSILStatus(Id silId, String status) {
    if (silId == null || String.isBlank(status)) {
        throw new AuraHandledException('Invalid input');
    }

    SIL__c sil = new SIL__c(
        Id = silId,
        Status__c = status
    );

    update sil;
}
}