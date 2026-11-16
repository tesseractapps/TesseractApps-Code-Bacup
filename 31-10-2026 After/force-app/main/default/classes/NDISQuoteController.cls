public with sharing class NDISQuoteController {
 
    private static final Decimal WEEKS_PER_MONTH = 4.333;
    private static final Decimal DAYS_PER_WEEK = 7;
    private static final Decimal DAYS_PER_MONTH = 30.416;
    private static final Decimal ONEOFF_PER_WEEK = 0.01931;
    private static final Decimal ONEOFF_PER_MONTH = 0.08328;
 
    /* ---------------------------
       Safe Decimal Conversion
       --------------------------- */
    private static Decimal asDecimal(Object v, Decimal fallback) {
        if (v == null) return fallback;
 
        try {
            if (v instanceof Decimal) return (Decimal)v;
            if (v instanceof Integer) return Decimal.valueOf((Integer)v);
            if (v instanceof Long) return Decimal.valueOf((Long)v);
            if (v instanceof Double) return Decimal.valueOf((Double)v);
            if (v instanceof String && String.isNotBlank((String)v))
                return Decimal.valueOf((String)v);
        } catch (Exception e) {
            return fallback;
        }
        return fallback;
    }
 
    private static String asString(Object v) {
        return v == null ? null : String.valueOf(v);
    }
 
    private static Id asId(Object v) {
        return v == null ? null : (Id)String.valueOf(v);
    }
 
    /* ---------------------------
       WRAPPERS
       --------------------------- */
    public class LineItemInput {
        public String id;
        public String quoteId;
        public String catalogueId;
        
        public String supportItem;
        
        public String price;
        public String quantity;
        public String frequency;
    
        public String interval;
    
        public String durationValue;
        public String durationPeriod;
    
        public String cost;
    }
 
    public class QuoteHeaderInput {
        public String id;
        public String participantId;
        public String newContactId; // ✅ ADD ONLY THIS
        public String quoteNumber;
        public String state;
        public String validFor;
    
        public Date serviceStart;
        public Date serviceEnd;
    
        public String preparedBy;
        public String additionalNotes;
        public String termsAndConditions;
        public String status;
    }
 
    /*	private static Id safeId(String v) {
        if (String.isBlank(v)) return null;
        if (v.length() == 15 || v.length() == 18) return (Id)v;
        return null;
    }*/
    
    private static Id safeId(String v) {
        if (String.isBlank(v)) {
            System.debug('⚠️ safeId: value is blank');
            return null;
        }

        if (v.length() == 15 || v.length() == 18) {
            try {
                return (Id)v;
            } catch (Exception e) {
                System.debug('❌ safeId: invalid Id format → ' + v);
                return null;
            }
        }

        System.debug('❌ safeId: NOT a Salesforce Id → ' + v);
        return null;
    }
   
    
 
    /* ---------------------------
       GET QUOTE DATA
       --------------------------- */
  /*  @AuraEnabled
    public static Map<String, Object> getQuoteData(Id participantId) {
 
        Map<String, Object> result = new Map<String, Object>();
 
        List<NDIS_Quote__c> quotes = [
            SELECT Id, Quote_Number__c, State__c, Valid_for_days__c,
                   Service_Period_Start__c, Service_Period_End__c,
                   Prepared_By__c, Additional_Notes__c, Participant__c,
                   Status__c
            FROM NDIS_Quote__c
            WHERE Participant__c = :participantId
            LIMIT 1
        ];
 
        if (quotes.isEmpty()) {
            result.put('quote', null);
            result.put('lineItems', new List<NDIS_Quote_LineItem__c>());
            return result;
        }
 
        NDIS_Quote__c q = quotes[0];
        result.put('quote', q);
 
        result.put('lineItems',
            [
                SELECT Id, NDIS_Quote__c, Support_Item__c, Price__c, Quantity__c,
                       Frequency__c, Occurrence_Interval__c,
                       Duration_Value__c, Duration_Period__c, Cost__c,
                       NDIS_Support_Catalogue__c
                FROM NDIS_Quote_LineItem__c
                WHERE NDIS_Quote__c = :q.Id
            ]
        );
 
        return result;
    }*/
    
    @AuraEnabled
    public static Map<String, Object> getQuoteData(Id participantId, Id newContactId) {
 
        Map<String, Object> result = new Map<String, Object>();
 
        List<NDIS_Quote__c> quotes = [
            SELECT Id, Quote_Number__c, State__c, Valid_for_days__c,
                   Service_Period_Start__c, Service_Period_End__c,
                   Prepared_By__c, Additional_Notes2__c, Participant__c,New_Contact__c,
                   Status__c, Terms_and_Conditions__c
            FROM NDIS_Quote__c
            WHERE
            (Participant__c != null AND Participant__c = :participantId)
         OR (New_Contact__c != null AND New_Contact__c = :newContactId)
        ORDER BY CreatedDate DESC
        LIMIT 1
        ];
 
        if (quotes.isEmpty()) {
            result.put('quote', null);
            result.put('lineItems', new List<NDIS_Quote_LineItem__c>());
            return result;
        }
 
        NDIS_Quote__c q = quotes[0];
        result.put('quote', q);
 
        result.put('lineItems',
            [
                SELECT Id, NDIS_Quote__c, Support_Item__c, Price__c, Quantity__c,
                       Frequency__c, Occurrence_Interval__c,
                       Duration_Value__c, Duration_Period__c, Cost__c,
                       NDIS_Support_Catalogue__c
                FROM NDIS_Quote_LineItem__c
                WHERE NDIS_Quote__c = :q.Id
            ]
        );
 
        return result;
    }
 
    /* ---------------------------
       SAVE HEADER
       --------------------------- */
         @AuraEnabled
        public static NDIS_Quote__c saveQuoteHeader(String headerJson) {
            try {
                System.debug('📥 Raw Header JSON = ' + headerJson);
                QuoteHeaderInput dto =
                    (QuoteHeaderInput) JSON.deserialize(headerJson, QuoteHeaderInput.class);
                System.debug('📦 Parsed Header DTO = ' + JSON.serializePretty(dto));
               /*  NDIS_Quote__c q = (dto.id != null)
                    ? new NDIS_Quote__c(Id = (Id)dto.id)
                    : new NDIS_Quote__c(); */
                Id qId = dto.id;
                        if (qId == null) {
                            throw new AuraHandledException(
                                'Update rejected: missing Quote Id'
                            );
                        }
				NDIS_Quote__c q = new NDIS_Quote__c(Id = qId);  
                
                q.Quote_Number__c         = dto.quoteNumber;
                q.State__c                = dto.state;
                q.Valid_for_days__c       = dto.validFor;
                q.Service_Period_Start__c = dto.serviceStart;
                q.Service_Period_End__c   = dto.serviceEnd;
                q.Prepared_By__c          = dto.preparedBy;
                q.Additional_Notes2__c     = dto.additionalNotes;
                q.Terms_and_Conditions__c = dto.termsAndConditions;
                q.Participant__c          = (Id)dto.participantId;
                q.New_Contact__c 		  = (Id)dto.newContactId;            							
                q.Status__c               = dto.status;
                System.debug('📤 Quote BEFORE UPSERT = ' + JSON.serializePretty(q));
                upsert q;
                System.debug('✅ Quote SAVED Id = ' + q.Id);
                return q;
            } catch (Exception e) {
                System.debug('❌ saveQuoteHeader ERROR → ' + e.getMessage());
                throw new AuraHandledException(e.getMessage());
            }
        }
         @AuraEnabled
        public static void saveQuotePdfUrl(Id quoteId, String pdfUrl, String quoteJson) {
            if (quoteId == null || String.isBlank(pdfUrl) || String.isBlank(quoteJson)) {
                return;
            }
        
            update new NDIS_Quote__c(
                Id = quoteId,
                QuotePdf_Url__c = pdfUrl,
                Quotepdf_Json__c = quoteJson
            );
        }

 			@AuraEnabled
        public static Id createQuoteHeader(String headerJson) {
            try {
                System.debug('📥 Raw CREATE Header JSON = ' + headerJson);
        
                QuoteHeaderInput dto =
                    (QuoteHeaderInput) JSON.deserialize(headerJson, QuoteHeaderInput.class);
        
                NDIS_Quote__c q = new NDIS_Quote__c();
        
                q.Participant__c          = (Id) dto.participantId;
                q.New_Contact__c          = (Id) dto.newContactId;
                q.Quote_Number__c         = dto.quoteNumber;
                q.State__c                = dto.state;
                q.Valid_for_days__c       = dto.validFor;
                q.Service_Period_Start__c = dto.serviceStart;
                q.Service_Period_End__c   = dto.serviceEnd;
                q.Prepared_By__c          = dto.preparedBy;
                q.Additional_Notes2__c     = dto.additionalNotes;
                q.Terms_and_Conditions__c = dto.termsAndConditions;
                q.Status__c               = dto.status;
        
                insert q;
        
                System.debug('✅ Quote CREATED Id = ' + q.Id);
                return q.Id;
        
            } catch (Exception e) {
                System.debug('❌ createQuoteHeader ERROR → ' + e.getMessage());
                throw new AuraHandledException(e.getMessage());
            }
        }

    /* ---------------------------
       SAVE LINE ITEMS
       --------------------------- */
        @AuraEnabled
    public static List<NDIS_Quote_LineItem__c> saveLineItems(String itemsJson) {
    
        System.debug('📥 Raw LineItems JSON = ' + itemsJson);
    
        List<LineItemInput> items =
            (List<LineItemInput>) JSON.deserialize(itemsJson, List<LineItemInput>.class);
    
        System.debug('📦 Parsed LineItems = ' + JSON.serializePretty(items));
    
        List<NDIS_Quote_LineItem__c> records = new List<NDIS_Quote_LineItem__c>();
    
        for (LineItemInput dto : items) {
            System.debug('🔍 Processing LineItem DTO = ' + JSON.serialize(dto));
                NDIS_Quote_LineItem__c li =
                String.isNotBlank(dto.id)
                ? new NDIS_Quote_LineItem__c(Id = safeId(dto.id))
                : new NDIS_Quote_LineItem__c();
        
            System.debug('🔍 dto.catalogueId RAW = ' + dto.catalogueId);
            System.debug('🔍 dto.quoteId RAW = ' + dto.quoteId);

            
            li.NDIS_Quote__c = safeId(dto.quoteId);
            li.NDIS_Support_Catalogue__c = safeId(dto.catalogueId);
            li.Support_Item__c = dto.supportItem;
    
            li.Price__c = asDecimal(dto.price, 0);
            li.Cost__c = asDecimal(dto.cost, 0);
            li.Quantity__c = asDecimal(dto.quantity, 1);
            li.Frequency__c = asDecimal(dto.frequency, 1);
            li.Occurrence_Interval__c = dto.interval;
            li.Duration_Value__c = asDecimal(dto.durationValue, 1);
            li.Duration_Period__c = dto.durationPeriod;
    
        //  li.Cost__c = computeCost(dto);
            
                System.debug('li.NDIS_Support_Catalogue__c'+li.NDIS_Support_Catalogue__c);
            System.debug('📤 LineItem BEFORE UPSERT = ' + JSON.serializePretty(li));
            records.add(li);
        }
    
        upsert records;
        return records;
    }
 
 
    /* ---------------------------
       COST CALCULATION
       --------------------------- */
   /* private static Decimal computeCost(LineItemInput dto) {
 
        Decimal price = asDecimal(dto.price, 0);
        Decimal qty   = asDecimal(dto.quantity, 1);
        Decimal freq  = asDecimal(dto.frequency, 1);
        Decimal dur   = asDecimal(dto.durationValue, 1);
 
        String interval = dto.interval == null ? 'weekly' : asString(dto.interval).toLowerCase();
        String period   = dto.durationPeriod == null ? 'weeks' : asString(dto.durationPeriod).toLowerCase();
 
        Decimal sessions = 0;
 
        if (interval == 'daily') {
            sessions = (period == 'weeks') ? freq * (dur * DAYS_PER_WEEK)
                                           : freq * (dur * DAYS_PER_MONTH);
        }
        else if (interval == 'weekly') {
            sessions = (period == 'weeks') ? freq * dur
                                           : freq * (dur * WEEKS_PER_MONTH);
        }
        else if (interval == 'fortnightly') {
            sessions = (period == 'weeks') ? freq * (dur * 0.5)
                                           : freq * (dur * WEEKS_PER_MONTH * 0.5);
        }
        else if (interval == 'monthly') {
            sessions = (period == 'weeks') ? freq * (dur * (1 / WEEKS_PER_MONTH))
                                           : freq * dur;
        }
        else if (interval == 'one-off') {
            sessions = (period == 'weeks') ? dur * ONEOFF_PER_WEEK
                                           : dur * ONEOFF_PER_MONTH;
        }
        else {
            sessions = freq * dur;
        }
 
        return (price * qty * sessions).setScale(2, RoundingMode.HALF_UP);
    } */
        private static Decimal computeCost(LineItemInput dto) {
        Decimal price = asDecimal(dto.price, 0);
        Decimal qty   = asDecimal(dto.quantity, 1);
        Decimal freq  = asDecimal(dto.frequency, 1);
        Decimal dur   = asDecimal(dto.durationValue, 1);
        String interval = String.isBlank(dto.interval) ? 'weekly' : dto.interval.toLowerCase();
        String period   = String.isBlank(dto.durationPeriod) ? 'weeks' : dto.durationPeriod.toLowerCase();
        Decimal sessions = freq * dur;
        return (price * qty * sessions).setScale(2, RoundingMode.HALF_UP);
    }
 	@AuraEnabled
    public static NDIS_Quote__c getQuoteById(Id quoteId) {
        return [
            SELECT Id, Quote_Number__c, QuotePdf_Url__c,Quotepdf_Json__c,Status__c,
            Valid_for_days__c,
            Service_Period_Start__c,State__c,
            Service_Period_End__c,CreatedDate,Participant__r.NDIS_Participant_ID__c,
            Participant__c, New_Contact__c, Additional_Notes2__c, Prepared_By__c, Terms_and_Conditions__c
            FROM NDIS_Quote__c
            WHERE Id = :quoteId
            LIMIT 1
        ];
    }
    
            @AuraEnabled
        public static Map<String, Object> getQuoteByIdWithLines(Id quoteId) {
    Map<String, Object> result = new Map<String, Object>();

    NDIS_Quote__c q = [
        SELECT Id, Quote_Number__c, State__c, Valid_for_days__c,
               Service_Period_Start__c, Service_Period_End__c,Quotepdf_Json__c,
               Prepared_By__c, Additional_Notes2__c,Support_Item__c,
               Participant__c, New_Contact__c, Status__c,
               QuotePdf_Url__c,Terms_and_Conditions__c
        FROM NDIS_Quote__c
        WHERE Id = :quoteId
        LIMIT 1
    	];

    List<NDIS_Quote_LineItem__c> lines = [
        SELECT Id, NDIS_Quote__c, Support_Item__c, Price__c, Quantity__c,
               Frequency__c, Occurrence_Interval__c,
               Duration_Value__c, Duration_Period__c, Cost__c,
               NDIS_Support_Catalogue__c
        FROM NDIS_Quote_LineItem__c
        WHERE NDIS_Quote__c = :quoteId
    ];

    result.put('quote', q);
    result.put('lineItems', lines);
    return result;
}

    
	// @AuraEnabled
    //     public static List<NDIS_Quote__c> getDraftQuotes(Id facilityId) {
    //         User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
    //         String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;
    //         return [
    //             SELECT
    //                 Id,
    //                 Name,
    //                 Quote_Number__c,
    //                 Status__c,
    //                 LastModifiedDate,
    //     			State__c,
    //                 Participant__c,
    //                 Participant__r.First_Name__c,
    //             	Participant__r.Last_Name__c,
    //             	Participant__r.Company__c,
    //     			Quotepdf_Json__c,
    //             	QuotePdf_Url__c,
    //                 New_Contact__c,
    //                 New_Contact__r.Name,
    //                 New_Contact__r.Facility__c,
    //     			Additional_Notes2__c,
    //             	Terms_and_Conditions__c
    //             FROM NDIS_Quote__c
    //             WHERE Status__c = 'Draft'
    //              AND (
    //                 // Participant__r.Facility__r.Organisation__c = :orgID
    //                 // OR
    //                 // New_Contact__r.Organization__c = :orgID
    //                 Participant__c IN (
    //                     SELECT Participant__c
    //                     FROM Participant_Facility__c
    //                     WHERE Active__c = true
    //                     AND Facility__c = :facilityId
    //                     AND Facility__r.Organisation__c = :orgID
    //                 )
    //                 OR
    //                 (
    //                     New_Contact__r.Organization__c = :orgID
    //                     AND New_Contact__r.Facility__c = :facilityId
    //                 )
    //             )
    //             ORDER BY LastModifiedDate DESC
    //         ];
    //     }
    @AuraEnabled
public static List<NDIS_Quote__c> getDraftQuotes(Id facilityId) {

    User objUser = [
        SELECT Organization_Name__c
        FROM User
        WHERE Id = :UserInfo.getUserId()
    ];

    Id orgID = [
        SELECT Id
        FROM Organisation__c
        WHERE Name = :objUser.Organization_Name__c
        LIMIT 1
    ].Id;

    List<NDIS_Quote__c> draftQuotes = new List<NDIS_Quote__c>();

    // Participant drafts
    draftQuotes.addAll([
        SELECT
            Id,
            Name,
            Quote_Number__c,
            Status__c,
            LastModifiedDate,
            State__c,
            Participant__c,
            Participant__r.First_Name__c,
            Participant__r.Last_Name__c,
            Participant__r.Company__c,
            Quotepdf_Json__c,
            QuotePdf_Url__c,
            New_Contact__c,
            New_Contact__r.Name,
            New_Contact__r.Facility__c,
            Additional_Notes2__c,
            Terms_and_Conditions__c
        FROM NDIS_Quote__c
        WHERE Status__c = 'Draft'
        AND Participant__c IN (
            SELECT Participant__c
            FROM Participant_Facility__c
            WHERE Active__c = true
            AND Facility__c = :facilityId
            AND Facility__r.Organisation__c = :orgID
        )
    ]);

    // New Contact drafts
    draftQuotes.addAll([
        SELECT
            Id,
            Name,
            Quote_Number__c,
            Status__c,
            LastModifiedDate,
            State__c,
            Participant__c,
            Participant__r.First_Name__c,
            Participant__r.Last_Name__c,
            Participant__r.Company__c,
            Quotepdf_Json__c,
            QuotePdf_Url__c,
            New_Contact__c,
            New_Contact__r.Name,
            New_Contact__r.Facility__c,
            Additional_Notes2__c,
            Terms_and_Conditions__c
        FROM NDIS_Quote__c
        WHERE Status__c = 'Draft'
        AND New_Contact__r.Organization__c = :orgID
        AND New_Contact__r.Facility__c = :facilityId
    ]);

    // Remove duplicates (if any)
    Map<Id, NDIS_Quote__c> uniqueQuotes = new Map<Id, NDIS_Quote__c>();
    for (NDIS_Quote__c quote : draftQuotes) {
        uniqueQuotes.put(quote.Id, quote);
    }

    List<NDIS_Quote__c> result = uniqueQuotes.values();
    result.sort();

    return result;
}
         
    @AuraEnabled
    public static Boolean deleteLineItem(Id lineItemId) {
        delete [SELECT Id FROM NDIS_Quote_LineItem__c WHERE Id = :lineItemId];
        return true;
    }
    @AuraEnabled
    public static void deleteQuoteLineItem(Id lineItemId) {
        if (lineItemId == null) return;

        delete [
            SELECT Id
            FROM NDIS_Quote_LineItem__c
            WHERE Id = :lineItemId
            LIMIT 1
        ];
    }
    
    @AuraEnabled
    public static New_Contact__c createNewContact(New_Contact__c newCon) {  

        if (newCon == null) {
            throw new AuraHandledException('New Contact data is empty');
        }    

        User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;
         newCon.Organization__c =orgID;
        try {
            
        
            if (newCon.Id != null) {
                update newCon;
            } else {
                insert newCon;
            }    

            return [
                SELECT Id, Name, Email__c, Phone__c, State__c, Organization_Name__c, Role__c, Organization__c,Facility__c,Facility__r.Type_of_Service__c
                FROM New_Contact__c
                WHERE Id = :newCon.Id
                LIMIT 1
            ];
        }catch (DmlException e) {
            // 🔑 THIS is what you need
            throw new AuraHandledException(
                'Save New Contact failed: ' + e.getDmlMessage(0)
            );
        }
    }        
    // @AuraEnabled
    // public static List<New_Contact__c> getNewContacts(String searchTerm) {
    //     User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
    //     String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;
    
    //     if (String.isBlank(searchTerm)) {
    //         return [
    //             SELECT Id, Name, Email__c, Phone__c, State__c, Organization_Name__c, Facility__c, Organization__c, Ndis_Id__c,Role__c
    //             FROM New_Contact__c
    //             WHERE Organization__c = :orgID
    //             ORDER BY CreatedDate DESC
    //         ];
    //     }
    
    //     String pattern = '%' + searchTerm + '%';
    
    //     return [
    //         SELECT Id, Name, Email__c, Phone__c, State__c, Organization_Name__c, Facility__c, Ndis_Id__c
    //         FROM New_Contact__c
    //         WHERE Organization__c = :orgID
    //         AND (
    //             Name LIKE :pattern
    //             OR Email__c LIKE :pattern
    //             OR Phone__c LIKE :pattern
    //         )
    //         ORDER BY CreatedDate DESC
    //     ];

    // }
    @AuraEnabled
    public static List<New_Contact__c> getNewContacts(String searchTerm, Id facilityId) {
        User objUser = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
        ];

        String orgID = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = :objUser.Organization_Name__c
            LIMIT 1
        ].Id;

        if (facilityId != null) {

            if (String.isBlank(searchTerm)) {
                return [
                    SELECT Id, Name, Email__c, Phone__c, State__c,
                        Organization_Name__c, Facility__c,Facility__r.Type_of_Service__c,
                        Organization__c, Ndis_Id__c, Role__c
                    FROM New_Contact__c
                    WHERE Organization__c = :orgID
                    AND Facility__c = :facilityId
                    ORDER BY CreatedDate DESC
                ];
            }

        } else {

            if (String.isBlank(searchTerm)) {
                return [
                    SELECT Id, Name, Email__c, Phone__c, State__c,
                        Organization_Name__c, Facility__c,Facility__r.Type_of_Service__c,
                        Organization__c, Ndis_Id__c, Role__c
                    FROM New_Contact__c
                    WHERE Organization__c = :orgID
                    ORDER BY CreatedDate DESC
                ];
            }

        }

        String pattern = '%' + searchTerm + '%';

        if (facilityId != null) {
            return [
                SELECT Id, Name, Email__c, Phone__c, State__c,
                    Organization_Name__c, Facility__c,Facility__r.Type_of_Service__c,
                    Organization__c, Ndis_Id__c, Role__c
                FROM New_Contact__c
                WHERE Organization__c = :orgID
                AND Facility__c = :facilityId
                AND (
                    Name LIKE :pattern
                    OR Email__c LIKE :pattern
                    OR Phone__c LIKE :pattern
                )
                ORDER BY CreatedDate DESC
            ];
        }

        return [
            SELECT Id, Name, Email__c, Phone__c, State__c,
                Organization_Name__c, Facility__c,Facility__r.Type_of_Service__c,
                Organization__c, Ndis_Id__c, Role__c
            FROM New_Contact__c
            WHERE Organization__c = :orgID
            AND (
                Name LIKE :pattern
                OR Email__c LIKE :pattern
                OR Phone__c LIKE :pattern
            )
            ORDER BY CreatedDate DESC
        ];
    }
    @AuraEnabled(cacheable=true)
    public static New_Contact__c getNewContactById(Id contactId) {
        return [
            SELECT Id, Name, Email__c, Phone__c, State__c, Organization_Name__c, Facility__c, Role__c, Ndis_Id__c
            FROM New_Contact__c
            WHERE Id = :contactId
            LIMIT 1
        ];
    }


    @AuraEnabled
    public static String getQuoteRecipientEmail(Id quoteId) {

        if (quoteId == null) return null;

        NDIS_Quote__c q = [
            SELECT
                Participant__r.Email__c,
                New_Contact__r.Email__c
            FROM NDIS_Quote__c
            WHERE Id = :quoteId
            LIMIT 1
        ];

        if (q.Participant__r?.Email__c != null) {
            return q.Participant__r.Email__c;
        }

        if (q.New_Contact__r?.Email__c != null) {
            return q.New_Contact__r.Email__c;
        }

        return null;
    }
}