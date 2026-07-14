public class CatalogueDataHandler {
    
    public class CatalogueDataWrapper {
        @AuraEnabled public List<NDIS_Support_Catalogue__c> catalogueData { get; set; }
        @AuraEnabled public String statesCombined { get; set; }
        @AuraEnabled public Map<String, Decimal> clientJunctionMapAmount { get; set; }
        @AuraEnabled public Map<String, String> clientJunctionMapName { get; set; }
        @AuraEnabled public Map<String, String> ShiftTypeMap { get; set; }
        @AuraEnabled public Map<String,String> entityIdMap {get;set;}
        @AuraEnabled public Map<String,String> entityNameMap {get;set;}
        
        public CatalogueDataWrapper(
            List<NDIS_Support_Catalogue__c> catalogueData,
            String statesCombined,
            Map<String, Decimal> clientJunctionMapAmount,
            Map<String, String> clientJunctionMapName,
            Map<String, String> shiftTypeMap,  // Changed parameter name to match variable name
            Map<String,String> entityIdMap,
            Map<String,String> entityNameMap
        ) {
            this.catalogueData = catalogueData;
            this.statesCombined = statesCombined;
            this.clientJunctionMapAmount = clientJunctionMapAmount;
            this.clientJunctionMapName = clientJunctionMapName;
            this.ShiftTypeMap = shiftTypeMap;  // Fixed assignment
            this.entityIdMap = entityIdMap;
            this.entityNameMap = entityNameMap;
        }
    }
    
    @AuraEnabled
    public static CatalogueDataWrapper getCatalogueData(String serviceType, String clientId, String accountingService) { 
        system.debug('serviceType '+serviceType);
        Map<String, Decimal> clientJunctionMapAmount = new Map<String, Decimal>();
        Map<String, String> clientJunctionMapName = new Map<String, String>();
        Map<String, String> shiftTypeMap = new Map<String, String>();  // Fixed variable name casing
        Map<String,String> entityIdMap = new Map<String,String>();
        Map<String,String> entityNameMap = new Map<String,String>();
        
        list<Funds_Tracker__c> fundOptions = [select id, name, state__c from Funds_Tracker__c where Id = :serviceType];

        if (fundOptions.isEmpty()) {
            return new CatalogueDataWrapper(new List<NDIS_Support_Catalogue__c>(), '', clientJunctionMapAmount, clientJunctionMapName, shiftTypeMap,entityIdMap, entityNameMap);
        }

        List<ClientFundTrackerJN__c> supportItems = [
            SELECT Id, NDIS_Support_Catalogue__c, Participant__c, Funds_Tracker__c,
                   Funds_Tracker__r.State__c, Amount__c, Edited_Catelog_Name__c, Shift_Type__c,
                   Entity_Profile__c,Entity_Profile__r.First_Name__c,Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c,
                   Xero_Entity__c,Xero_Entity__r.First_Name__c,Xero_Entity__r.Last_Name__c
            FROM ClientFundTrackerJN__c 
            WHERE Participant__c = :clientId
            AND Funds_Tracker__c = :serviceType 
            AND State__c = :fundOptions[0].state__c
        ];
        
        if (supportItems.isEmpty()) {
            return new CatalogueDataWrapper(new List<NDIS_Support_Catalogue__c>(), '', clientJunctionMapAmount, clientJunctionMapName, shiftTypeMap,entityIdMap, entityNameMap);
        }
        
        String statesCombined = supportItems[0].Funds_Tracker__r.State__c;
        List<String> supportItemIds = new List<String>();
        
        for (ClientFundTrackerJN__c item : supportItems) {
            supportItemIds.add(item.NDIS_Support_Catalogue__c);
            clientJunctionMapAmount.put(item.NDIS_Support_Catalogue__c, item.Amount__c);
            clientJunctionMapName.put(item.NDIS_Support_Catalogue__c, item.Edited_Catelog_Name__c);
            shiftTypeMap.put(item.NDIS_Support_Catalogue__c, item.Shift_Type__c);

            String entityId;
            String entityName = '';
            if (accountingService == 'Tesseract System') {
                entityId = item.Entity_Profile__c;
                if (item.Entity_Profile__r != null) {
                    entityName = item.Entity_Profile__r.Name__c != null
                                    ? item.Entity_Profile__r.Name__c
                                    : (
                                        (item.Entity_Profile__r.First_Name__c == null ? '' : item.Entity_Profile__r.First_Name__c)
                                        + ' ' +
                                        (item.Entity_Profile__r.Last_Name__c == null ? '' : item.Entity_Profile__r.Last_Name__c)
                                    ).trim();
                }
            } else if (accountingService == 'Xero' || accountingService == 'MYOB') {
                entityId = item.Xero_Entity__c;
                if (item.Xero_Entity__r != null) {
                    entityName = ((item.Xero_Entity__r.First_Name__c == null ? '' : item.Xero_Entity__r.First_Name__c)
                                    + ' ' +
                                    (item.Xero_Entity__r.Last_Name__c == null ? '' : item.Xero_Entity__r.Last_Name__c)
                                ).trim();
                }
            }
            entityIdMap.put( item.NDIS_Support_Catalogue__c, entityId);
            entityNameMap.put( item.NDIS_Support_Catalogue__c,entityName);
        }
        
        List<NDIS_Support_Catalogue__c> listNDISCatalog = [
            SELECT Id, Name, Support_Item_Name__c, Support_Category_Number__c, Start_Date__c,
                   ACT__c, NSW__c, NT__c, QLD__c, SA__c, TAS__c, VIC__c, WA__c,
                   Support_Item_Number__c, Available_fund__c 
            FROM NDIS_Support_Catalogue__c 
            WHERE Id IN :supportItemIds
        ];
        
        return new CatalogueDataWrapper(listNDISCatalog, statesCombined, clientJunctionMapAmount, clientJunctionMapName, shiftTypeMap,entityIdMap, entityNameMap);
    }
}