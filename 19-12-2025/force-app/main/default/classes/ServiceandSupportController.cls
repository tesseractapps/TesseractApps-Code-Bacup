public class ServiceandSupportController {
   
    
    public static void updateAvailableFunds(List<Services_and_Support_Plan__c> servList, Map<Id, Services_and_Support_Plan__c> oldServiceMap) {
        Set<Id> ids = new Set<Id>();
    
        for (Services_and_Support_Plan__c service : servList) {
            if (service.Funds_Tracker__c != null) {
                ids.add(service.Funds_Tracker__c);
            }
        }
    
        List<Funds_Tracker__c> fundsList = [SELECT Id, Available_Funds__c, Spent_Amt__c FROM Funds_Tracker__c WHERE Id IN :ids];
        system.debug('fundsList' +fundsList);
        Map<Id, Funds_Tracker__c> mapFunds = new Map<Id, Funds_Tracker__c>();
    
        for (Funds_Tracker__c fund : fundsList) {
            mapFunds.put(fund.Id, fund);
        }
    
        Map<Id, Decimal> runningAvailableAmountMap = new Map<Id, Decimal>();
        Map<Id, Funds_Tracker__c> parentFundUpdates = new Map<Id, Funds_Tracker__c>();
    
        if (oldServiceMap == null) {
            for (Services_and_Support_Plan__c services : servList) {
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
                   services.Amount__c.addError('Amount exceeds available funds.');
                }
    
                availableAmount -= services.Amount__c;
                system.debug('availableAmount ' + availableAmount);
                services.Available_Fund__c = availableAmount;
                runningAvailableAmountMap.put(services.Funds_Tracker__c, availableAmount);
    
                Funds_Tracker__c currentFundTracker = mapFunds.get(services.Funds_Tracker__c);
                currentFundTracker.Spent_Amt__c += services.Amount__c;
                system.debug('currentFundTracker ' + currentFundTracker.Spent_Amt__c);
    
                parentFundUpdates.put(currentFundTracker.Id, currentFundTracker);
            }
        } else {
            for (Services_and_Support_Plan__c services : servList) {
                system.debug(' in fund tracker else update');
                Decimal originalAmount = oldServiceMap.containsKey(services.Id) ? oldServiceMap.get(services.Id).Amount__c : 0;
                Decimal availableAmount = mapFunds.get(services.Funds_Tracker__c).Available_Funds__c + originalAmount;
               
                // 🛑 Validation: Check if updated amount exceeds recalculated available
                if (services.Amount__c > availableAmount) {
                    services.Amount__c.addError('Amount exceeds available funds.');
                }
      			 if(services.Qty__c !=oldServiceMap.get(services.Id).Qty__c || services.Service_Type__c  !=oldServiceMap.get(services.Id).Service_Type__c ){
                services.Available_Fund__c = availableAmount - services.Amount__c;
    
                Funds_Tracker__c currentFundTracker = mapFunds.get(services.Funds_Tracker__c);
                currentFundTracker.Spent_Amt__c = currentFundTracker.Spent_Amt__c + services.Amount__c - originalAmount;
             
                      parentFundUpdates.put(currentFundTracker.Id, currentFundTracker);
                }
              
            }
        }
    
        if (!parentFundUpdates.isEmpty()) {
            update parentFundUpdates.values();
        }
    }

    
   public static void updateAvailableFundsOnDelete(List<Services_and_Support_Plan__c> deletedServices) {
        Set<Id> fundTrackerIds = new Set<Id>();
        
        // Collect parent Fund Tracker IDs from deleted records
        for (Services_and_Support_Plan__c service : deletedServices) {
            fundTrackerIds.add(service.Funds_Tracker__c);
        }
        
        // Query parent Fund Tracker records
        List<Funds_Tracker__c> fundTrackers = [SELECT Id, Spent_Amt__c 
                                               FROM Funds_Tracker__c 
                                               WHERE Id IN :fundTrackerIds];
        
        Map<Id, Funds_Tracker__c> fundTrackerMap = new Map<Id, Funds_Tracker__c>();
        for (Funds_Tracker__c fund : fundTrackers) {
            fundTrackerMap.put(fund.Id, fund);
        }
        
        // Update the fund tracker values based on deleted services
        Map<Id, Funds_Tracker__c> parentFundUpdates = new Map<Id, Funds_Tracker__c>();
        for (Services_and_Support_Plan__c deletedService : deletedServices) {
            if (fundTrackerMap.containsKey(deletedService.Funds_Tracker__c)) {
                Funds_Tracker__c fundTracker = fundTrackerMap.get(deletedService.Funds_Tracker__c);
                
                // Reduce the spent amount accordingly
                fundTracker.Spent_Amt__c -= deletedService.Amount__c;
                
                parentFundUpdates.put(fundTracker.Id, fundTracker);
            }
        }
        
        // Update parent fund tracker records
        if (!parentFundUpdates.isEmpty()) {
            update parentFundUpdates.values();
        }
    }

}