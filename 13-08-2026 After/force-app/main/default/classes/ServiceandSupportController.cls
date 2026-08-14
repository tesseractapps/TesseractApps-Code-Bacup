public class ServiceandSupportController {
   
    
    public static void updateAvailableFunds(List<Services_and_Support_Plan__c> servList, Map<Id, Services_and_Support_Plan__c> oldServiceMap) {
        Id currentUserId = UserInfo.getUserId();

        User u = [
            SELECT Organization_Name__c
            FROM User
            WHERE Id = :currentUserId
        ];

       List<Organisation__c> orgList = [
            SELECT Accounting_Services__c
            FROM Organisation__c
            WHERE Name = :u.Organization_Name__c
            LIMIT 1
        ];

        if (orgList.isEmpty()) {
            return;
        }

        Organisation__c org = orgList[0];
        String accountingService = org.Accounting_Services__c;
        System.debug('Accounting Service => ' + accountingService);
        if (String.isBlank(accountingService)) {
            return;
        }

        Set<Id> ids = new Set<Id>();

        Set<Id> entityFundTrackerIds = new Set<Id>();   //New
        Set<Id> supportCatalogueIds = new Set<Id>();    //New
        Set<String> financialYears = new Set<String>();   //New
    
        for (Services_and_Support_Plan__c service : servList) {
            if (service.Funds_Tracker__c != null) {
                ids.add(service.Funds_Tracker__c);
            }
            //New
            Boolean isUpdateEntity = (oldServiceMap == null);

            if (oldServiceMap != null &&
                oldServiceMap.containsKey(service.Id)) {

                Services_and_Support_Plan__c oldRec =
                    oldServiceMap.get(service.Id);

                isUpdateEntity =
                    service.Service_Type__c != oldRec.Service_Type__c
                    || service.Funds_Tracker__c != oldRec.Funds_Tracker__c;
            }

            if (isUpdateEntity &&
                service.Funds_Tracker__c != null &&
                service.Service_Type__c != null &&
                service.Date_of_Service__c != null) {

                entityFundTrackerIds.add(service.Funds_Tracker__c);
                supportCatalogueIds.add(service.Service_Type__c);

                Integer year = service.Date_of_Service__c.year();
                String financialYear;

                if (service.Date_of_Service__c.month() >= 7) {
                    // Example: 2025-26
                    financialYear = year + '-' +
                        String.valueOf(year + 1).right(2);

                } else {
                    // Example: 2024-25
                    financialYear = (year - 1) + '-' +
                        String.valueOf(year).right(2);
                }


                financialYears.add(financialYear);
            }
            //New
        }
    
        List<Funds_Tracker__c> fundsList = [SELECT Id, Available_Funds__c, Spent_Amt__c,Original_Spent_Amount__c FROM Funds_Tracker__c WHERE Id IN :ids];
        system.debug('fundsList' +fundsList);
        Map<Id, Funds_Tracker__c> mapFunds = new Map<Id, Funds_Tracker__c>();
    
        for (Funds_Tracker__c fund : fundsList) {
            mapFunds.put(fund.Id, fund);
        }

        //New
        Map<String, ClientFundTrackerJN__c> clientFundTrackerMap = new Map<String, ClientFundTrackerJN__c>();

        if (!entityFundTrackerIds.isEmpty()) {

            for (ClientFundTrackerJN__c cft : [

                SELECT
                    Id,
                    Funds_Tracker__c,
                    Financial_Year__c,
                    NDIS_Support_Catalogue__c,
                    Entity_Profile__c,
                    Xero_Entity__c,
                    NDIS_Support_Catalogue__r.Is_Government__c,
                    NDIS_Support_Catalogue__r.Financial_Year__c

                FROM ClientFundTrackerJN__c

                WHERE Funds_Tracker__c IN :entityFundTrackerIds
                AND NDIS_Support_Catalogue__c IN :supportCatalogueIds
                //AND Financial_Year__c IN :financialYears
                AND (
                    Financial_Year__c IN :financialYears
                    OR (
                        NDIS_Support_Catalogue__r.Is_Government__c = FALSE
                        AND NDIS_Support_Catalogue__r.Financial_Year__c = NULL
                    )
                )

            ]) {

                // String key =
                // cft.Funds_Tracker__c + '_' +
                // cft.NDIS_Support_Catalogue__c + '_' +
                // cft.Financial_Year__c;
                String key = cft.Funds_Tracker__c + '_' + cft.NDIS_Support_Catalogue__c;

                if (String.isNotBlank(cft.Financial_Year__c)) {
                    key += '_' + cft.Financial_Year__c;
                }

                clientFundTrackerMap.put(key, cft);
            }
        }
        //New
    
        Map<Id, Decimal> runningAvailableAmountMap = new Map<Id, Decimal>();
        Map<Id, Funds_Tracker__c> parentFundUpdates = new Map<Id, Funds_Tracker__c>();
    
        if (oldServiceMap == null) {
            for (Services_and_Support_Plan__c services : servList) {
                if (services.SIL_Service__c == true) {
                    continue;
                }

                //New
                if (services.Date_of_Service__c != null) {
                    Integer year = services.Date_of_Service__c.year();
                    String financialYear;

                    if (services.Date_of_Service__c.month() >= 7) {

                        financialYear =
                            year + '-' +
                            String.valueOf(year + 1).right(2);

                    } else {

                        financialYear =
                            (year - 1) + '-' +
                            String.valueOf(year).right(2);
                    }

                    String entityKey =
                        services.Funds_Tracker__c + '_' +
                        services.Service_Type__c + '_' +
                        financialYear;

                    //if (clientFundTrackerMap.containsKey(entityKey)) {

                        ClientFundTrackerJN__c cft = clientFundTrackerMap.get(entityKey);

                        //services.Entity_Profile__c = cft.Entity_Profile__c;
                        //services.Xero_Entity__c =cft.Xero_Entity__c;
                        // if (accountingService == 'Tesseract System') {
                        //     services.Entity_Profile__c = cft.Entity_Profile__c;
                        // } else if (
                        //     accountingService == 'Xero' ||
                        //     accountingService == 'MYOB'
                        // ) {
                        //     services.Xero_Entity__c = cft.Xero_Entity__c;
                        // }
                        if (cft == null) {
                            String nonGovtKey = services.Funds_Tracker__c + '_' + services.Service_Type__c;
                            cft = clientFundTrackerMap.get(nonGovtKey);
                        }

                        if (cft != null) {
                            if (accountingService == 'Tesseract System') {
                                services.Entity_Profile__c = cft.Entity_Profile__c;
                            } else if (accountingService == 'Xero' || accountingService == 'MYOB') {
                                services.Xero_Entity__c = cft.Xero_Entity__c;
                            }
                        }
                    //}
                }
                //New

                Decimal availableAmount;
    
                if (!runningAvailableAmountMap.containsKey(services.Funds_Tracker__c)) {
                    availableAmount = mapFunds.get(services.Funds_Tracker__c).Available_Funds__c;
                } else {
                    availableAmount = runningAvailableAmountMap.get(services.Funds_Tracker__c);
                }
                   system.debug('availableAmount 1==> ' + availableAmount);
                 system.debug('runningAvailableAmountMap ' + runningAvailableAmountMap);
    
                // 🛑 Validation: Check if amount exceeds available
                if (services.Amount__c > availableAmount) {
                   services.Amount__c.addError(services.Participant_Name__c + ' - Amount exceeds available funds.');
                }
    
                availableAmount -= services.Amount__c;
                system.debug('availableAmount ' + availableAmount);
                services.Available_Fund__c = availableAmount;
                runningAvailableAmountMap.put(services.Funds_Tracker__c, availableAmount);
    
                Funds_Tracker__c currentFundTracker = mapFunds.get(services.Funds_Tracker__c);
                if (currentFundTracker != null) {
                    currentFundTracker.Spent_Amt__c += services.Amount__c;
                    // currentFundTracker.Original_Spent_Amount__c += services.Amount__c;
                    if (currentFundTracker.Original_Spent_Amount__c == null) {
                        currentFundTracker.Original_Spent_Amount__c = 0;
                    }

                    currentFundTracker.Original_Spent_Amount__c += services.Amount__c;
                    system.debug('currentFundTracker ' + currentFundTracker.Spent_Amt__c);
                    system.debug('currentFundTracker ' + currentFundTracker.Original_Spent_Amount__c);
    
                    parentFundUpdates.put(currentFundTracker.Id, currentFundTracker);
                }
            }
        } else {
            for (Services_and_Support_Plan__c services : servList) {
                 if (services.SIL_Service__c == true) {
                        continue;
                    }
                system.debug(' in fund tracker else update');

                //New
                Services_and_Support_Plan__c oldRec =
                    oldServiceMap.get(services.Id);

                Boolean isUpdateEntity =
                    services.Service_Type__c != oldRec.Service_Type__c ||
                    services.Funds_Tracker__c != oldRec.Funds_Tracker__c;

                if (isUpdateEntity) {
                    if (services.Date_of_Service__c != null) {
                        Integer year = services.Date_of_Service__c.year();
                        String financialYear;

                        if (services.Date_of_Service__c.month() >= 7) {

                            financialYear =
                                year + '-' +
                                String.valueOf(year + 1).right(2);

                        } else {

                            financialYear =
                                (year - 1) + '-' +
                                String.valueOf(year).right(2);
                        }

                        String entityKey =
                            services.Funds_Tracker__c + '_' +
                            services.Service_Type__c + '_' +
                            financialYear;

                        //if (clientFundTrackerMap.containsKey(entityKey)) {

                            ClientFundTrackerJN__c cft = clientFundTrackerMap.get(entityKey);

                            // services.Entity_Profile__c = cft.Entity_Profile__c;
                            // services.Xero_Entity__c =cft.Xero_Entity__c;
                            // if (accountingService == 'Tesseract System') {
                            //     services.Entity_Profile__c = cft.Entity_Profile__c;
                            // } else if (
                            //     accountingService == 'Xero' ||
                            //     accountingService == 'MYOB'
                            // ) {
                            //     services.Xero_Entity__c = cft.Xero_Entity__c;
                            // }
                            if (cft == null) {
                                String nonGovtKey = services.Funds_Tracker__c + '_' + services.Service_Type__c;
                                cft = clientFundTrackerMap.get(nonGovtKey);
                            }

                            if (cft != null) {
                                if (accountingService == 'Tesseract System') {
                                    services.Entity_Profile__c = cft.Entity_Profile__c;
                                } else if (accountingService == 'Xero' || accountingService == 'MYOB') {
                                    services.Xero_Entity__c = cft.Xero_Entity__c;
                                }
                            }

                        //}
                    }
                }
                //New
                Decimal originalAmount = oldServiceMap.containsKey(services.Id) ? oldServiceMap.get(services.Id).Amount__c : 0;
                system.debug('originalAmount >>>'+ originalAmount);
                //Decimal availableAmount = mapFunds.get(services.Funds_Tracker__c).Available_Funds__c + originalAmount;
                Decimal availableAmount = 0;
                if (services.Funds_Tracker__c != null && mapFunds.containsKey(services.Funds_Tracker__c)) {
                    availableAmount = (mapFunds.get(services.Funds_Tracker__c).Available_Funds__c != null 
                                       ? mapFunds.get(services.Funds_Tracker__c).Available_Funds__c 
                                       : 0) 
                                       + originalAmount;
                } else {
                    System.debug('⚠️ No Funds Tracker found for service Id: ' + services.Id + 
                                 ', Funds_Tracker__c: ' + services.Funds_Tracker__c);
                }
                system.debug('availableAmount >>>'+ availableAmount);
               
                // 🛑 Validation: Check if updated amount exceeds recalculated available
                if (services.Amount__c > availableAmount) {
                    services.Amount__c.addError(services.Participant_Name__c + ' - Amount exceeds available funds.');
                }
      			if(services.Qty__c !=oldServiceMap.get(services.Id).Qty__c || services.Service_Type__c  !=oldServiceMap.get(services.Id).Service_Type__c || services.Edited_Unit_Price__c  !=oldServiceMap.get(services.Id).Edited_Unit_Price__c ){
                	services.Available_Fund__c = availableAmount - services.Amount__c;
                     system.debug('services.Available_Fund__c >>>'+ services.Available_Fund__c);
    
                    Funds_Tracker__c currentFundTracker = mapFunds.get(services.Funds_Tracker__c);
                    if (currentFundTracker != null) {
                        currentFundTracker.Spent_Amt__c = currentFundTracker.Spent_Amt__c +(services.Amount__c - originalAmount);
                        system.debug(' currentFundTracker.Spent_Amt__c >>>'+ currentFundTracker.Spent_Amt__c );
                        if (currentFundTracker.Original_Spent_Amount__c == null) {
                            currentFundTracker.Original_Spent_Amount__c = 0;
                        }
                        currentFundTracker.Original_Spent_Amount__c = currentFundTracker.Original_Spent_Amount__c +(services.Amount__c - originalAmount);
                        system.debug(' currentFundTracker.Original_Spent_Amount__c >>>'+ currentFundTracker.Original_Spent_Amount__c );
                
                        parentFundUpdates.put(currentFundTracker.Id, currentFundTracker);
                    }
                }
              
            }
        }
    
        /* if (!parentFundUpdates.isEmpty()) {
            update parentFundUpdates.values();
        } */
        if (!parentFundUpdates.isEmpty()) {

            update parentFundUpdates.values();

            System.debug(
                'Funds Tracker Updated Successfully'
            );

                // =====================================
                // SEND THRESHOLD BADGES
                // =====================================

            Set<Id> fundIds = new Set<Id>();

            for (Funds_Tracker__c updatedFund :
                parentFundUpdates.values()) {

                if (updatedFund.Id != null) {

                    fundIds.add(updatedFund.Id);

                    System.debug(
                        'Checking Threshold Notification For => ' +
                        updatedFund.Id
                    );
                }
            }

            if (!fundIds.isEmpty()) {

                NotificationServices.sendClientFundThresholdNotification(
                        new List<Id>(fundIds)
                    );

                System.debug(
                    'Threshold Notifications Sent => ' +
                    fundIds
                );
            }
        }
    }

   public static void updateAvailableFundsOnDelete(List<Services_and_Support_Plan__c> deletedServices) {
       
        Set<Id> fundTrackerIds = new Set<Id>();
        
        // Collect parent Fund Tracker IDs from deleted records
        for (Services_and_Support_Plan__c service : deletedServices) {

            fundTrackerIds.add(service.Funds_Tracker__c);
        }
        
        // Query parent Fund Tracker records
        List<Funds_Tracker__c> fundTrackers = [SELECT Id, Spent_Amt__c ,Original_Spent_Amount__c
                                               FROM Funds_Tracker__c 
                                               WHERE Id IN :fundTrackerIds];
        
        Map<Id, Funds_Tracker__c> fundTrackerMap = new Map<Id, Funds_Tracker__c>();
        for (Funds_Tracker__c fund : fundTrackers) {
            fundTrackerMap.put(fund.Id, fund);
        }
        
        // Update the fund tracker values based on deleted services
        Map<Id, Funds_Tracker__c> parentFundUpdates = new Map<Id, Funds_Tracker__c>();
        for (Services_and_Support_Plan__c deletedService : deletedServices) {
            if (deletedService.SIL_Service__c == true) {
            continue;
            }
            if (fundTrackerMap.containsKey(deletedService.Funds_Tracker__c)) {
                Funds_Tracker__c fundTracker = fundTrackerMap.get(deletedService.Funds_Tracker__c);
                
                // Reduce the spent amount accordingly
                fundTracker.Spent_Amt__c -= deletedService.Amount__c;
                if (fundTracker.Original_Spent_Amount__c == null) {
                    fundTracker.Original_Spent_Amount__c = (fundTracker.Spent_Amt__c != null) ? fundTracker.Spent_Amt__c : 0;
                }
                fundTracker.Original_Spent_Amount__c -= deletedService.Amount__c;
                parentFundUpdates.put(fundTracker.Id, fundTracker);
            }
        }
        
        // Update parent fund tracker records
        if (!parentFundUpdates.isEmpty()) {
            update parentFundUpdates.values();
        }


Set<Id> fundIds = new Set<Id>();

for (Funds_Tracker__c fund :
    parentFundUpdates.values()) {

    if (fund.Id != null) {

        fundIds.add(fund.Id);
    }
}

if (!fundIds.isEmpty()) {

    NotificationServices.sendClientFundThresholdNotification( new List<Id>(fundIds) );

    System.debug(
        'Threshold recheck after delete => ' +
        fundIds
    );
}
    }

}