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
            WHERE Facility__c = :facilityId
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
        SELECT Id, Name,
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
            Entity_Name__c        = req.entityName,
            SIL_To_Facility__c    = req.facilityId,
            SIL_To_Participant__c = req.participantId,
            Status__c             = 'Active'
        );

        upsert sil;

        // ── HANDLE ITEMS ──
        if (req.selectedItems != null && !req.selectedItems.isEmpty()) {

            // 🔁 EDIT MODE
            if (req.silId != null) {

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
}