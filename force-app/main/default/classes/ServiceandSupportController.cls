public class ServiceandSupportController {
    public static void updateAvailableFunds(List<Services_and_Support_Plan__c> servList,Map<Id, Services_and_Support_Plan__c> oldServiceMap){
        Set<Id> ids = new Set<Id>();
        
        // Collect parent Fund Tracker IDs
        for(Services_and_Support_Plan__c service : servList){
            ids.add(service.Funds_Tracker__c);
        }
       
        // Query parent Fund Tracker records
        List<Funds_Tracker__c> fundsList = [SELECT Id, Available_Funds__c,Spent_Amt__c FROM Funds_Tracker__c WHERE Id IN :ids];
        Map<Id, Funds_Tracker__c> mapFunds = new Map<Id, Funds_Tracker__c>();
        
        for(Funds_Tracker__c fund : fundsList){
            mapFunds.put(fund.Id, fund); 
            System.debug('Map funds??? ' + mapFunds);
        } 
        
        // Store the calculated available amount (initially from the parent)
        Map<Id, Decimal> runningAvailableAmountMap = new Map<Id, Decimal>();
         Map<Id, Funds_Tracker__c> parentFundUpdates = new Map<Id, Funds_Tracker__c>();
        // Iterate through the services and calculate the new available fund
        if(oldServiceMap ==null) {
             for(Services_and_Support_Plan__c services : servList){
            Decimal avalAmount = 0;
            decimal currentSpentAmount = mapFunds.get(services.Funds_Tracker__c).Spent_Amt__c;
            // If this is the first record for this Fund Tracker, start with the Available_Funds__c from the parent
            if(!runningAvailableAmountMap.containsKey(services.Funds_Tracker__c)) {
                avalAmount = mapFunds.get(services.Funds_Tracker__c).Available_Funds__c;
            } else {
                // For subsequent records, use the updated amount from the previous iterations
                avalAmount = runningAvailableAmountMap.get(services.Funds_Tracker__c);
            }
            
            // Subtract the current service amount from the available amount
            avalAmount -= services.Amount__c;
            
            // Update the child service's Available_Fund__c
            services.Available_Fund__c = avalAmount;
            
            // Store the updated available amount for this Fund Tracker ID
            runningAvailableAmountMap.put(services.Funds_Tracker__c, avalAmount);
            
            Funds_Tracker__c currentFundTracker = mapFunds.get(services.Funds_Tracker__c);
          
            currentFundTracker.Spent_Amt__c = currentSpentAmount + services.Amount__c;  
         
             parentFundUpdates.put(currentFundTracker.Id, currentFundTracker);
            
            System.debug('Updated Available Fund for Fund Tracker ' + services.Funds_Tracker__c + ': ' + avalAmount);
        }
        }
       
        if(oldServiceMap !=null){
            for(Services_and_Support_Plan__c services : servList){
                Decimal avalAmount = 0;
                //system.debug('old amount '+oldServiceMap.get(services.id).Amount__c);
               // system.debug('present service amount '+services.Amount__c);
                // system.debug('present available amount '+mapFunds.get(services.Funds_Tracker__c).Available_Funds__c);
                avalAmount = mapFunds.get(services.Funds_Tracker__c).Available_Funds__c -services.Amount__c +oldServiceMap.get(services.id).Amount__c ;
               //  system.debug(' after service available amount '+avalAmount);
                services.Available_Fund__c=avalAmount;
                decimal currentSpentAmount = mapFunds.get(services.Funds_Tracker__c).Spent_Amt__c +services.Amount__c -oldServiceMap.get(services.id).Amount__c ;
               // system.debug('current fund tracker amount '+currentSpentAmount);
                Funds_Tracker__c currentFundTracker = mapFunds.get(services.Funds_Tracker__c);
                currentFundTracker.Spent_Amt__c = currentSpentAmount ;  
                parentFundUpdates.put(currentFundTracker.Id, currentFundTracker);
                
                
            }
        }
        
        
         if (parentFundUpdates.size() > 0) {
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