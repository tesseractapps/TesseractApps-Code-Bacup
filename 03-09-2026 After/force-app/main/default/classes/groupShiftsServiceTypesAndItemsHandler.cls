public with sharing class groupShiftsServiceTypesAndItemsHandler {

    public class GroupShiftCompleteWrapper {
        @AuraEnabled
        public ShiftWithStaff__c shift;
        @AuraEnabled
        public List<GroupShiftServiceWrapper> services;
    }

    public class GroupShiftServiceWrapper {
        @AuraEnabled
        public Services_and_Support_Plan__c service;
        @AuraEnabled
        public List<Funds_Tracker__c> funds;
        @AuraEnabled
        public CatalogueDataHandler.CatalogueDataWrapper catalogue;
    }

    @AuraEnabled
    public static List<GroupShiftCompleteWrapper> getOtherGroupShiftDetails(
        Id addShiftId,
        Id currentShiftWithStaffId,
        String dateOfService
    ) {
        List<GroupShiftCompleteWrapper> response = new List<GroupShiftCompleteWrapper>();

        // 1. Get all shifts with their services
        List<ShiftWithStaff__c> shiftList = [
            SELECT Id,
                   Staff__c,
                   Staff__r.Display_Nickname__c,
                   Staff_Final_Hourly_Rate__c,
                   Shift_Calculated_Duration__c,
                   Shift_Start_Time__c,
                   Shift_End_Time__c,
                   Start_Date__c,
                   Shift_End_Date__c,
                   RefId__c,
                   Role__c,
                   Staff_Paid_Break__c,
                   Minimum_Engagement_Applied__c,
                   Broken_Extended_Wage__c,
                   Broken_Extended_Duration__c,
                   Broken_Extended_Rate__c,
                   Broken_Shift_Allowance__c,
                   Split_Shift_RefId__c,
                   New_Split_Shift__c,
                   Broken_Shift__c,
                   Do_you_want_to_set_this_Recurring_Roster__c,
                   Shift_Category__c,
                   Status__c,
                   Add_Shift__r.Duration__c,
                   Add_Shift__r.Role__c,
                   Add_Shift__r.Shift_Start_End_Time__c,
                   (
                       SELECT Id,
                              Client__c,
                              Participant_Name__c,
                              Participant_Forms__c,
                              Funds_Tracker__c,
                              Funds_Tracker__r.Registration_Group__c,
                              Service_Type__c,
                              Support_Item_Name__c,
                              Qty__c,
                              Amount__c,
                              Edited_Unit_Price__c,
                              Custom_Shift_Reference_Id__c
                       FROM Services_and_Support_Plans__r
                   )
            FROM ShiftWithStaff__c
            WHERE Add_Shift__c = :addShiftId
            AND Id != :currentShiftWithStaffId
            ORDER BY CreatedDate
        ];

        if (shiftList.isEmpty()) {
            return response;
        }

        // 2. Collect all client IDs from services
        Set<Id> clientIds = new Set<Id>();
        for (ShiftWithStaff__c sh : shiftList) {
            if (sh.Services_and_Support_Plans__r != null) {
                for (Services_and_Support_Plan__c sp : sh.Services_and_Support_Plans__r) {
                    if (sp.Client__c != null) {
                        clientIds.add(sp.Client__c);
                    }
                }
            }
        }

        // 3. Get all Funds (Service Types) for all clients in ONE query
        List<Funds_Tracker__c> allFunds = [
            SELECT Id,
                   Client__c,
                   Registration_Group__c,
                   Amount_approved__c,
                   Spent_Amt__c,
                   Usage_Threshold__c,
                   Available_Funds__c,
                   Plan_Type__c,
                   Service_Type__c,
                   Shift_Name__c,
                   Entity_Profile__c,
                   State__c,
                   Status__c,
                   Threshold_Crossed__c
            FROM Funds_Tracker__c
            WHERE Client__c IN :clientIds
            AND Status__c = 'Active'
        ];

        // 4. Group Funds by Client
        Map<Id, List<Funds_Tracker__c>> fundsByClient = new Map<Id, List<Funds_Tracker__c>>();
        Set<Id> fundTrackerIds = new Set<Id>();
        
        for (Funds_Tracker__c ft : allFunds) {
            if (!fundsByClient.containsKey(ft.Client__c)) {
                fundsByClient.put(ft.Client__c, new List<Funds_Tracker__c>());
            }
            fundsByClient.get(ft.Client__c).add(ft);
            fundTrackerIds.add(ft.Id);
        }

        Date financialYearDate = Date.valueOf(dateOfService);

        Integer year = financialYearDate.year();

        Date financialYearStart;
        Date financialYearEnd;

        if (financialYearDate.month() >= 7) {
            financialYearStart = Date.newInstance(year, 7, 1);
            financialYearEnd   = Date.newInstance(year + 1, 6, 30);
        } else {
            financialYearStart = Date.newInstance(year - 1, 7, 1);
            financialYearEnd   = Date.newInstance(year, 6, 30);
        }

        // 5. Get all Support Items (Catalogue) for all Funds in ONE query
        List<ClientFundTrackerJN__c> supportItems = [
            SELECT Id,
                   NDIS_Support_Catalogue__c,
                   Participant__c,
                   Funds_Tracker__c,
                   Funds_Tracker__r.State__c,
                   Amount__c,
                   Edited_Catelog_Name__c,
                   Shift_Type__c,
                   Entity_Profile__c,
                   Entity_Profile__r.First_Name__c,
                   Entity_Profile__r.Last_Name__c,
                   Entity_Profile__r.Name__c,
                   Xero_Entity__c,
                   Xero_Entity__r.First_Name__c,
                   Xero_Entity__r.Last_Name__c
            FROM ClientFundTrackerJN__c
            WHERE Participant__c IN :clientIds
            AND Funds_Tracker__c IN :fundTrackerIds 
           AND (
                (
                    NDIS_Support_Catalogue__r.Start_Date__c <= :financialYearEnd
                    AND
                    NDIS_Support_Catalogue__r.End_Date__c >= :financialYearStart
                )
                OR
                (
                    NDIS_Support_Catalogue__r.Start_Date__c = NULL
                    AND
                    NDIS_Support_Catalogue__r.End_Date__c = NULL
                )
            )
        ];

        // 6. Collect Catalogue IDs
        Set<Id> catalogueIds = new Set<Id>();
        Map<String, List<ClientFundTrackerJN__c>> supportMap = new Map<String, List<ClientFundTrackerJN__c>>();
        
        for (ClientFundTrackerJN__c item : supportItems) {
            if (item.NDIS_Support_Catalogue__c != null) {
                catalogueIds.add(item.NDIS_Support_Catalogue__c);
            }
            
            // Key = ClientId_FundTrackerId (to get catalogues for specific client + fund)
            String key = String.valueOf(item.Participant__c) + '_' + String.valueOf(item.Funds_Tracker__c);
            
            if (!supportMap.containsKey(key)) {
                supportMap.put(key, new List<ClientFundTrackerJN__c>());
            }
            supportMap.get(key).add(item);
        }

        // 7. Get all Catalogue Items in ONE query
        Map<Id, NDIS_Support_Catalogue__c> catalogueMap = new Map<Id, NDIS_Support_Catalogue__c>([
            SELECT Id,
                   Name,
                   Support_Item_Name__c,
                   Support_Category_Number__c,
                   Start_Date__c,
                   ACT__c,
                   NSW__c,
                   NT__c,
                   QLD__c,
                   SA__c,
                   TAS__c,
                   VIC__c,
                   WA__c,
                   Support_Item_Number__c,
                   Available_Fund__c,
                   Is_Government__c
            FROM NDIS_Support_Catalogue__c
            WHERE Id IN :catalogueIds
        ]);

        // 8. Build Catalogue Wrappers for each Client+Fund combination
        Map<String, CatalogueDataHandler.CatalogueDataWrapper> catalogueWrapperMap = 
            new Map<String, CatalogueDataHandler.CatalogueDataWrapper>();

        for (String key : supportMap.keySet()) {
            Map<String, Decimal> amountMap = new Map<String, Decimal>();
            Map<String, String> nameMap = new Map<String, String>();
            Map<String, String> shiftTypeMap = new Map<String, String>();
            List<NDIS_Support_Catalogue__c> catalogueList = new List<NDIS_Support_Catalogue__c>();
            String statesCombined = '';

            for (ClientFundTrackerJN__c item : supportMap.get(key)) {
                statesCombined = item.Funds_Tracker__r.State__c;
                amountMap.put(item.NDIS_Support_Catalogue__c, item.Amount__c);
                nameMap.put(item.NDIS_Support_Catalogue__c, item.Edited_Catelog_Name__c);
                shiftTypeMap.put(item.NDIS_Support_Catalogue__c, item.Shift_Type__c);

                if (catalogueMap.containsKey(item.NDIS_Support_Catalogue__c)) {
                    catalogueList.add(catalogueMap.get(item.NDIS_Support_Catalogue__c));
                }
            }

            catalogueWrapperMap.put(
                key,
                new CatalogueDataHandler.CatalogueDataWrapper(
                    catalogueList,
                    statesCombined,
                    amountMap,
                    nameMap,
                    shiftTypeMap,
                    new Map<String, String>(),
                    new Map<String, String>()
                )
            );
        }

        // 9. Build final response
        for (ShiftWithStaff__c sh : shiftList) {
            GroupShiftCompleteWrapper shiftWrapper = new GroupShiftCompleteWrapper();
            shiftWrapper.shift = sh;
            shiftWrapper.services = new List<GroupShiftServiceWrapper>();

            if (sh.Services_and_Support_Plans__r != null && 
                !sh.Services_and_Support_Plans__r.isEmpty()) {
                
                for (Services_and_Support_Plan__c sp : sh.Services_and_Support_Plans__r) {
                    GroupShiftServiceWrapper serviceWrapper = new GroupShiftServiceWrapper();
                    serviceWrapper.service = sp;

                    // Get Funds for this service's client
                    List<Funds_Tracker__c> clientFunds = fundsByClient.get(sp.Client__c);
                    serviceWrapper.funds = (clientFunds == null) 
                        ? new List<Funds_Tracker__c>() 
                        : clientFunds;

                    // Get Catalogue Data for this service (Client + Fund Tracker)
                    String key = String.valueOf(sp.Client__c) + '_' + String.valueOf(sp.Funds_Tracker__c);
                    CatalogueDataHandler.CatalogueDataWrapper wrapper = catalogueWrapperMap.get(key);
                    
                    if (wrapper != null) {
                        serviceWrapper.catalogue = wrapper;
                    } else {
                        serviceWrapper.catalogue = new CatalogueDataHandler.CatalogueDataWrapper(
                            new List<NDIS_Support_Catalogue__c>(),
                            '',
                            new Map<String, Decimal>(),
                            new Map<String, String>(),
                            new Map<String, String>(),
                            new Map<String, String>(),
                            new Map<String, String>()
                        );
                    }

                    shiftWrapper.services.add(serviceWrapper);
                }
            }

            response.add(shiftWrapper);
        }

        return response;
    }
}