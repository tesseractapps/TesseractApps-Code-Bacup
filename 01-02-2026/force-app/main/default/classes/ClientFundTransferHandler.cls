/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 06-18-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class ClientFundTransferHandler {

    @AuraEnabled
    public static List<Fund_Transfer_Amount__c> fundTrackerSpent(String fundRecord){
        List<Fund_Transfer_Amount__c> fudList = [select id,Amount_incl_GST__c,Funds_Tracker__c,Amount__c,GST__c,Service_Date__c,Description__c,Status__c from Fund_Transfer_Amount__c];
       return fudList;              
    }

   /* @AuraEnabled
    public static List<Funds_Tracker__c> fetchfundTracker(string clientId){       
        List<Funds_Tracker__c> fundList = [select id,Amount_approved__c,Client__c,Plan_Type__c,Client_Name__c,Approved_Date__c,Available_Funds__c,Spent_Amt__c,Registration_Group__c,Status__c,State__c from Funds_Tracker__c where Client__c =:clientId Order by createddate desc ];
        return fundList;
    }*/  /*Changed by vamshi addula to display catalogue Support Item Name*/
    @AuraEnabled
    public static List<Funds_Tracker__c> fetchfundTracker(string clientId){       
        List<Funds_Tracker__c> fundList = [select id,Amount_approved__c,Client__c,Plan_Type__c,Client_Name__c,Approved_Date__c,Available_Funds__c,Spent_Amt__c,Registration_Group__c,Status__c,State__c,(SELECT Id,NDIS_Support_Catalogue__r.Support_Item_Name__c,
                                                                                                                                                                                                         NDIS_Support_Catalogue__r.Support_Item_Number__c, 
                                                                                                                                                                                                         Amount__c,Shift_Type__c,Edited_Catelog_Name__c,State__c FROM ClientFundTrackers__r) from Funds_Tracker__c where Client__c=:clientId Order by createddate desc];
        return fundList;
    }
    
    
    @AuraEnabled
    public static List<Client__c> fundTrackerSpentAmount(string clientId,string approvedAmount, string availableFund, String spentFund){
        List<Client__c> fundList = [select Total_Approved_Amounts__c,Total_Available_Funds__c,Total_Spent_Funds__c from Client__c Where id=:clientId ];
        return fundList;       
    }
    
    @AuraEnabled(cacheable=false)
    public static void saveFundTracker(String fundRecord,String amount,String gst,String description,String serviceDate,String serviceStatus){
            Fund_Transfer_Amount__c fundTracker = new Fund_Transfer_Amount__c();
            fundTracker.Funds_Tracker__c=fundRecord;
        if(String.isNotBlank(amount)){fundTracker.Amount__c=Decimal.valueOf(amount);
        }
        if(String.isNotBlank(gst)){fundTracker.GST__c=Decimal.valueOf(gst);
        }
        if(String.isNotBlank(serviceDate)){fundTracker.Service_Date__c=Date.valueOf(serviceDate);
        }
            fundTracker.Description__c=description;
            fundTracker.Status__c=serviceStatus;
            insert fundTracker;
    }

    @AuraEnabled
    public static List<Funds_Tracker__c> fundTrackerRecord(String clientId){
        List<Funds_Tracker__c> fudRec = new List<Funds_Tracker__c>();
            fudRec= [select id,Amount_approved__c,Client__c,Client_Name__c,Approved_Date__c,Available_Funds__c,Spent_Amt__c,Service_Type_Name__c,Status__c,Registration_Group__c from Funds_Tracker__c where Client__c =:clientId];
        
        if(fudRec.size()>0){ return fudRec;
        }else{
            return null;
        }
     }

    @AuraEnabled(cacheable=false)
    public static void savFundTransfer(String clientId,String amountApprovedValue,String amountApprovedDateValue){
            Funds_Tracker__c fundTracker = new Funds_Tracker__c();
            fundTracker.Client__c=clientId;
        if(String.isNotBlank(amountApprovedValue)){ fundTracker.Amount_approved__c=Decimal.valueOf(amountApprovedValue);
        }
         if(String.isNotBlank(amountApprovedDateValue)){fundTracker.Approved_Date__c=Date.valueOf(amountApprovedDateValue);
         }
            insert fundTracker;
    }
    
    @AuraEnabled
    public static  List<ClientFundTrackerJN__c> getSelectedSupportItems(Id fundTrackerId, Id clientId, String state) { 
        System.debug('Fetch State :'+state);
        System.debug('FundTrackerId : '+ fundTrackerId);
        System.debug('ClientId : '+ clientId);
        List<ClientFundTrackerJN__c> supportItems = [
            SELECT Id,NDIS_Support_Catalogue__c,Participant__c,Funds_Tracker__c,State__c,Funds_Tracker__r.State__c,Amount__c,Edited_Catelog_Name__c,Shift_Type__c FROM ClientFundTrackerJN__c 
            WHERE Participant__c =:clientId AND Funds_Tracker__c = :fundTrackerId AND State__c =:state]; //manendra added Shift_Type__c in query
        
        System.Debug('Support Items :'+supportItems);
        
       /* List<String> supportItemIds = new List<String>();
        for (ClientFundTrackerJN__c item : supportItems) {
            supportItemIds.add(item.NDIS_Support_Catalogue__c);
        }
        
        List<NDIS_Support_Catalogue__c> listNDISCatalog = [SELECT ID,Name,Support_Item_Name__c,Start_Date__c,ACT__c,NSW__c,NT__c,QLD__c,SA__c,TAS__c,VIC__c,WA__c,Support_Item_Number__c from NDIS_Support_Catalogue__c where Id IN:supportItemIds];
        System.Debug('List of NDIS Support Catalog :'+listNDISCatalog); */
        return supportItems; 
    }
    
    @AuraEnabled
    public static void deletedSelectedId(List<Id> selectedDeletedId) {  
        System.debug('Delete Id : '+selectedDeletedId);
        List<ClientFundTrackerJN__c> delList = [ SELECT Id, NDIS_Support_Catalogue__c, Participant__c, Funds_Tracker__c, Funds_Tracker__r.State__c 
            FROM ClientFundTrackerJN__c WHERE Id IN :selectedDeletedId]; 
        System.debug('Junction Id :'+delList);
        delete delList;
    }
    
    @AuraEnabled
    public static Boolean checkFundExists(Id clientId, String serviceType) {
         system.debug('serviceType ==>  '+serviceType);
        
        List<Funds_Tracker__c> existingFunds = [
            SELECT Id
            FROM Funds_Tracker__c
            WHERE Client__c = :clientId
            AND Registration_Group__c = :serviceType
            LIMIT 1
        ];
        return !existingFunds.isEmpty();
    }
    
    @AuraEnabled
    public static List<NDIS_Support_Catalogue__c> getNDISCatalog(List<Id> ndisId){
        List<NDIS_Support_Catalogue__c> ndisList = [select Id,Name,Support_Item_Name__c,Start_Date__c,ACT__c,NSW__c,NT__c,QLD__c,SA__c,TAS__c,VIC__c,WA__c,Support_Item_Number__c from NDIS_Support_Catalogue__c where Id =:ndisId];
        return ndisList;
    }
    
    
    @AuraEnabled
    public static Facility__c getFacilityDetails(Id facilityId) {
        try {
            return [
                SELECT Id, Name, Type_of_Service__c, CreatedDate 
                FROM Facility__c 
                WHERE Id = :facilityId 
                LIMIT 1
            ];
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching Facility details: ' + e.getMessage());
        }
    }
   //Split Funds logic vamshi
    @AuraEnabled(cacheable=false)
    public static List<fund_split__c> getFundSplits(Id fundTrackerId) {
        List<fund_split__c> fundsplitsList = new List<fund_split__c>();
    
        if (fundTrackerId != null && String.isNotBlank(fundTrackerId)) {
            fundsplitsList = [
                SELECT Id, Name, Funds_Tracker__c, Allocated__c, Carry_Forward__c,
                       Start_Date__c, End_Date__c, Status__c, Spent_Amount__c
                FROM fund_split__c
                WHERE Funds_Tracker__c = :fundTrackerId
                ORDER BY Start_Date__c ASC
            ];
        }
    
        System.debug('Returning fund splits for Tracker: ' + fundTrackerId + ' → ' + fundsplitsList.size());
        return fundsplitsList;
    }
    // system.debug('Received Splits: ' + (splits == null ? 0 : splits.size()));
      @AuraEnabled
    public static List<fund_split__c> saveFundSplits(Id fundTrackerId,List<fund_split__c> splits) {
        try {
            System.debug('Entered saveFundSplits');
            System.debug('fundTrackerId: ' + fundTrackerId);
            
            if (splits == null || splits.isEmpty()) {
                throw new AuraHandledException('No fund split records to save.');
            }
    
            // Ensure parent Id is set
            for (fund_split__c fs : splits) {
                fs.Funds_Tracker__c = fundTrackerId;
            }
    
            /* ----------------------------------------------------
                STEP 1: Identify existing splits for this tracker
               ---------------------------------------------------- */
            List<fund_split__c> existingSplits = [
                SELECT Id
                FROM fund_split__c
                WHERE Funds_Tracker__c = :fundTrackerId
            ];
    
            /* ----------------------------------------------------
                STEP 2: Collect incoming IDs (existing records)
               ---------------------------------------------------- */
            Set<Id> incomingIds = new Set<Id>();
            for (fund_split__c fs : splits) {
                if (fs.Id != null){            incomingIds.add(fs.Id);
                }
            }
    
            /* ----------------------------------------------------
               STEP 3: Find old-format splits to delete
               ---------------------------------------------------- */
            List<fund_split__c> splitsToDelete = new List<fund_split__c>();
            Set<Id> deletedIds = new Set<Id>();
    
            for (fund_split__c oldSplit : existingSplits) {
                if (!incomingIds.contains(oldSplit.Id)) {
                    splitsToDelete.add(oldSplit);
                    deletedIds.add(oldSplit.Id);
                }
            }
    
            if (!splitsToDelete.isEmpty()) {
                delete splitsToDelete;
                System.debug('Deleted old fund splits: ' + splitsToDelete.size());
            }
    
            /* ----------------------------------------------------
               🔴 STEP 4: Protect upsert from deleted IDs
               ---------------------------------------------------- */
            List<fund_split__c> safeSplits = new List<fund_split__c>();
            for (fund_split__c fs : splits) {
                if (fs.Id == null || !deletedIds.contains(fs.Id)) {
                    safeSplits.add(fs);
                }
            }
    
            /* ----------------------------------------------------
               🔴 STEP 5: Upsert new + valid existing splits
               ---------------------------------------------------- */
            upsert safeSplits;
    
            System.debug('Upsert successful, fetching latest splits');
    
            /* ----------------------------------------------------
               🔴 STEP 6: Return fresh data for UI
               ---------------------------------------------------- */
            return [
                SELECT Id, Name, Funds_Tracker__c,
                       Allocated__c, Carry_Forward__c,
                       Start_Date__c, End_Date__c, Status__c
                FROM fund_split__c
                WHERE Funds_Tracker__c = :fundTrackerId
                ORDER BY Start_Date__c ASC
            ];
    
        } catch (Exception e) {
            System.debug('Exception in saveFundSplits: ' + e.getMessage());
            System.debug('Stack Trace: ' + e.getStackTraceString());
            throw new AuraHandledException(
                'Error saving fund splits: ' + e.getMessage()
            );
        }
    }	
    @AuraEnabled
    public static List<fund_split__c> updateFundSplits(
        Id fundTrackerId,
        List<fund_split__c> splits
    ) {
        if (fundTrackerId == null) {            throw new AuraHandledException('Fund Tracker Id is required.');
        }
    
        for (fund_split__c fs : splits) {
            fs.Funds_Tracker__c = fundTrackerId;
        }
    
        update splits;
    
        return [
            SELECT Id, Name, Funds_Tracker__c,
                   Allocated__c, Carry_Forward__c,
                   Start_Date__c, End_Date__c, Status__c
            FROM fund_split__c
            WHERE Funds_Tracker__c = :fundTrackerId
            ORDER BY Start_Date__c
        ];
    }

    @AuraEnabled
    public static List<fund_split__c> replaceFundSplits(
        Id fundTrackerId,
        List<fund_split__c> newSplits
    ) {
        if (fundTrackerId == null) {         throw new AuraHandledException('Fund Tracker Id is required.');
        }
        
        // Delete ALL old splits
        List<fund_split__c> oldSplits = [
            SELECT Id
            FROM fund_split__c
            WHERE Funds_Tracker__c = :fundTrackerId
        ];
        
        if (!oldSplits.isEmpty()) {
            delete oldSplits;
        }
        
        // Insert ALL new splits
        for (fund_split__c fs : newSplits) {
            fs.Id = null; // force insert
            fs.Funds_Tracker__c = fundTrackerId;
        }
        
        insert newSplits;
        
        return [
            SELECT Id, Name, Funds_Tracker__c,
            Allocated__c, Carry_Forward__c,
            Start_Date__c, End_Date__c, Status__c
            FROM fund_split__c
            WHERE Funds_Tracker__c = :fundTrackerId
            ORDER BY Start_Date__c
        ];
    }
		
    //Period management- advancements
    //
        /*    @AuraEnabled
            public static List<fund_split__c> recalculateFundPeriods(Id fundTrackerId,Id clientId) {
            
                // Fetch all fund periods for this fund tracker
                List<fund_split__c> fundPeriods = [
                    SELECT Id,Name,
                           Allocated__c,
                           Carry_Forward__c,
                           Spent_Amount__c,
                           Start_Date__c,
                           End_Date__c,
                           Status__c 
                    FROM fund_split__c
                    WHERE Funds_Tracker__c = :fundTrackerId
                    ORDER BY Start_Date__c
                ];
            
                // Holds carry-forward from the previous period
                Decimal carryForwardAmount = 0;
		  Decimal previousCarryForward = 0;                
             // Decimal previousCarryForward = 0;

        for (fund_split__c fundPeriod : fundPeriods) {
        
            // 1️⃣ Calculate spent amount for this period
            AggregateResult spentAmountResult = [
                SELECT SUM(Amount__c) totalSpentAmount
                FROM Services_and_Support_Plan__c
                WHERE Client__c = :clientId
                AND Funds_Tracker__c = :fundTrackerId
                AND Date_of_Service__c >= :fundPeriod.Start_Date__c
                AND Date_of_Service__c <= :fundPeriod.End_Date__c
            ];
        
            Decimal spentAmount =
                (Decimal) spentAmountResult.get('totalSpentAmount');
            spentAmount = spentAmount == null ? 0 : spentAmount;
        
            fundPeriod.Spent_Amount__c = spentAmount;
        
            // 2️⃣ Effective available (internal only)
            Decimal effectiveAllocated =
                fundPeriod.Allocated__c + previousCarryForward;
        
            Decimal remaining = effectiveAllocated - spentAmount;
        
            Decimal periodCarryForward;
        
            if (remaining < 0) {
                fundPeriod.Status__c = 'Overutilised';
                periodCarryForward = 0;
                previousCarryForward = 0;
            } else {
                // 🔑 Carry forward ONLY unused from THIS period
                periodCarryForward =
                    Math.max(0, fundPeriod.Allocated__c - spentAmount);
        
                previousCarryForward =
                    previousCarryForward + periodCarryForward;
            }
        
            fundPeriod.Carry_Forward__c = periodCarryForward;
        
            System.debug(
                'Period ' + fundPeriod.Name +
                ' | Allocated=' + fundPeriod.Allocated__c +
                ' | Spent=' + spentAmount +
                ' | PeriodCarryForward=' + periodCarryForward +
                ' | RunningBalance=' + previousCarryForward
            );
        }
        
        // ✅ Save ONCE
        update fundPeriods;
        return fundPeriods;               
      } */
    
   /*     @AuraEnabled
public static List<fund_split__c> recalculateFundPeriods(
    Id fundTrackerId,
    Id clientId
) {
    Date today = Date.today();

    // 1️⃣ Load periods
    List<fund_split__c> periods = [
        SELECT Id, Name,
               Allocated__c,
               Carry_Forward__c,
               Spent_Amount__c,
               Start_Date__c,
               End_Date__c,
               Status__c
        FROM fund_split__c
        WHERE Funds_Tracker__c = :fundTrackerId
        ORDER BY Start_Date__c
    ];

    if (periods.isEmpty()) {
        return periods;
    }

    // 🔑 NEW: compute global date window
    Date minStartDate;
    Date maxEndDate;

    for (fund_split__c p : periods) {
        if (minStartDate == null || p.Start_Date__c < minStartDate) {
            minStartDate = p.Start_Date__c;
        }
        if (maxEndDate == null || p.End_Date__c > maxEndDate) {
            maxEndDate = p.End_Date__c;
        }
    }

    // 2️⃣ Load services ONCE (bounded by period dates)
    List<Services_and_Support_Plan__c> services = [
        SELECT Amount__c, Date_of_Service__c
        FROM Services_and_Support_Plan__c
        WHERE Client__c = :clientId
        AND Funds_Tracker__c = :fundTrackerId
        AND Amount__c != null
        AND Date_of_Service__c >= :minStartDate
        AND Date_of_Service__c <= :maxEndDate
    ];

    // 3️⃣ Calculate spent + carry forward PER PERIOD
    Map<Id, Decimal> periodCarryMap = new Map<Id, Decimal>();

    for (fund_split__c period : periods) {

        Decimal spent = 0;

        for (Services_and_Support_Plan__c s : services) {
            if (
                s.Date_of_Service__c >= period.Start_Date__c &&
                s.Date_of_Service__c <= period.End_Date__c
            ) {
                spent += s.Amount__c;
            }
        }

        period.Spent_Amount__c = spent;

        Decimal carry = period.Allocated__c - spent;
        
      if (carry < 0) {
            period.Carry_Forward__c = 0;
            carry = 0;
        } else {
            period.Carry_Forward__c = carry;
        } 
        
       if (spent == 0) {
            // No usage → no carry forward shown
                period.Carry_Forward__c = 0;
            }
        //If the participant spent MORE than allocated, there is no carry forward.
            else if (carry < 0) {
                period.Carry_Forward__c = 0;
                 carry = 0;
            }
        //i.e period.Allocated__c - spent;
            else {
                period.Carry_Forward__c = carry;
            } 

        periodCarryMap.put(period.Id, carry);

        System.debug(
            'Period ' + period.Name +
            ' | Allocated=' + period.Allocated__c +
            ' | Spent=' + spent +
            ' | CarryForward=' + period.Carry_Forward__c
        );
    }

    // 4️⃣ Apply carry forward ONLY after period ends
    for (Integer i = 0; i < periods.size() - 1; i++) {
        fund_split__c current = periods[i];
        fund_split__c next = periods[i + 1];

        if (
            current.End_Date__c < today &&
            periodCarryMap.get(current.Id) > 0
        ) {
            next.Allocated__c += periodCarryMap.get(current.Id);
        }
    }

    // 5️⃣ Save once
    update periods;
    return periods;
} */
       @AuraEnabled
public static Map<String, Decimal> previewSpentForPeriods(
    Id clientId,
    List<Map<String, Object>> periods
) {
    Date minStart;
    Date maxEnd;

    // 1️⃣ Find global date range
    for (Map<String, Object> p : periods) {
        Date s = Date.valueOf((String)p.get('startDate'));
        Date e = Date.valueOf((String)p.get('endDate'));

        if (minStart == null || s < minStart) minStart = s;
        if (maxEnd == null || e > maxEnd) maxEnd = e;
    }

    if (minStart == null || maxEnd == null) {        return new Map<String, Decimal>();
    }

    // 2️⃣ Query only relevant services
    List<Services_and_Support_Plan__c> services = [
        SELECT Amount__c, Date_of_Service__c
        FROM Services_and_Support_Plan__c
        WHERE Client__c = :clientId
        AND Amount__c != null
        AND Date_of_Service__c >= :minStart
        AND Date_of_Service__c <= :maxEnd
    ];

    // 3️⃣ Calculate spent per period
    Map<String, Decimal> result = new Map<String, Decimal>();

    for (Map<String, Object> p : periods) {
        String label = (String)p.get('label');
        Date startDate = Date.valueOf((String)p.get('startDate'));
        Date endDate   = Date.valueOf((String)p.get('endDate'));

        Decimal spent = 0;
        for (Services_and_Support_Plan__c s : services) {            if (s.Date_of_Service__c >= startDate && s.Date_of_Service__c <= endDate) {   spent += s.Amount__c;
            }
        }
        result.put(label, spent);
    }

    return result;
}

	/*	@AuraEnabled
public static List<fund_split__c> recalculateFundPeriods(
    Id fundTrackerId,
    Id clientId
) {
    // 1️⃣ Load periods
    List<fund_split__c> periods = [
        SELECT Id, Name,
               Allocated__c,
               Carry_Forward__c,
               Spent_Amount__c,
               Start_Date__c,
               End_Date__c,
               Status__c
        FROM fund_split__c
        WHERE Funds_Tracker__c = :fundTrackerId
        ORDER BY Start_Date__c
    ];
		
    if (periods.isEmpty()) {
        return periods;
    }

    // 🔒 OLD VALUES MAP (USED ONLY TO PRESERVE SPENT)
   Map<Id, fund_split__c> oldMap = new Map<Id, fund_split__c>(periods);
  
	
    // 2️⃣ Determine global date range
    Date minStart;
    Date maxEnd;

    for (fund_split__c p : periods) {
        if (minStart == null || p.Start_Date__c < minStart) {
            minStart = p.Start_Date__c;
        }
        if (maxEnd == null || p.End_Date__c > maxEnd) {
            maxEnd = p.End_Date__c;
        }
    }

    // 3️⃣ Load services once
    List<Services_and_Support_Plan__c> services = [
        SELECT Amount__c, Date_of_Service__c
        FROM Services_and_Support_Plan__c
        WHERE Client__c = :clientId
        AND Funds_Tracker__c = :fundTrackerId
        AND Amount__c != null
        AND Date_of_Service__c >= :minStart
        AND Date_of_Service__c <= :maxEnd
    ];

    // =====================================================
    // 🔑 FIX #1: FINALISE STATUS FIRST (MOVED UP)
    // =====================================================
    Date today = Date.today();

    for (fund_split__c p : periods) {
        if (p.End_Date__c < today) {
            p.Status__c = 'Completed';
        }
        else if (p.Start_Date__c <= today && p.End_Date__c >= today) {
            p.Status__c = 'Active';
        }
        else {
            p.Status__c = 'Future';
        }
    }
    //6 and 12 Periods logic
    Boolean hasActive = false;

        for (fund_split__c p : periods) {
            if (p.Status__c == 'Active') {
                hasActive = true;
                break;
            }
        }
        
        if (!hasActive && !periods.isEmpty()) {
            // fallback: first non-completed period becomes Active
            for (fund_split__c p : periods) {
                if (p.Status__c != 'Completed') {
                    p.Status__c = 'Active';
                    break;
                }
            }
        }
    // =====================================================
    // 4️⃣ Calculate spent + carry forward PER PERIOD
    // =====================================================
    for (fund_split__c period : periods) {

        Decimal spent = 0;

        // 🔑 FIX #2: CALCULATE SPENT FIRST
        for (Services_and_Support_Plan__c s : services) {
            if (
                s.Date_of_Service__c >= period.Start_Date__c &&
                s.Date_of_Service__c <= period.End_Date__c
            ) {
                spent += s.Amount__c;
            }
        }

        // 🔑 FIX #3: PRESERVE SPENT FOR COMPLETED PERIODS
        if (period.Status__c == 'Completed' && oldMap.containsKey(period.Id)) {
            period.Spent_Amount__c = oldMap.get(period.Id).Spent_Amount__c;
        } else {
            period.Spent_Amount__c = spent;
        }

        Decimal allocated = period.Allocated__c == null ? 0 : period.Allocated__c;

        // 🔑 FIX #4: CARRY FORWARD ONLY FOR ACTIVE PERIOD
        if (period.Status__c == 'Active' && period.Spent_Amount__c > 0) {
            period.Carry_Forward__c =
                Math.max(0, allocated - period.Spent_Amount__c);
        } else {
            // Completed + Future
            period.Carry_Forward__c = 0;
        }
    }

    // =====================================================
    // ️ Roll unused funds to NEXT period allocation
    // =====================================================
    for (Integer i = 0; i < periods.size() - 1; i++) {
        fund_split__c current = periods[i];
        fund_split__c nextPeriod = periods[i + 1];

        if (
            current.Status__c == 'Completed'
        ) {
            Decimal rollAmount = 0;

            if (current.Spent_Amount__c > 0) {
                rollAmount = current.Carry_Forward__c;
            } else {
                rollAmount = current.Allocated__c == null ? 0 : current.Allocated__c;
            }

            if (rollAmount > 0) {
                nextPeriod.Allocated__c =
                    (nextPeriod.Allocated__c == null ? 0 : nextPeriod.Allocated__c)
                    + rollAmount;

                // clear carry forward after transfer
                current.Carry_Forward__c = 0;
            }

            // activate next period if needed
            if (nextPeriod.Status__c == 'Future') {
                nextPeriod.Status__c = 'Active';
            }
        }
    } 

    // 5️⃣ Save once
    update periods;
    return periods;
}*/
    
   @AuraEnabled
public static List<fund_split__c> recalculateFundPeriods(
    Id fundTrackerId,
    Id clientId
) {
    // 1️⃣ Load periods
    List<fund_split__c> periods = [
        SELECT Id, Name,
               Allocated__c,
               Carry_Forward__c,
               Spent_Amount__c,
               Start_Date__c,
               End_Date__c,
               Status__c
        FROM fund_split__c
        WHERE Funds_Tracker__c = :fundTrackerId
        ORDER BY Start_Date__c
    ];

    if (periods.isEmpty()) {        return periods;
    }

    // 🔒 Snapshot OLD values (used only to preserve spent)
    Map<Id, fund_split__c> oldMap = new Map<Id, fund_split__c>(periods);

    // 2️⃣ Determine global date range
    Date minStart;
    Date maxEnd;

    for (fund_split__c p : periods) {
        if (minStart == null || p.Start_Date__c < minStart) {
            minStart = p.Start_Date__c;
        }
        if (maxEnd == null || p.End_Date__c > maxEnd) {
            maxEnd = p.End_Date__c;
        }
    }

    // 3️⃣ Load services ONCE
    List<Services_and_Support_Plan__c> services = [
        SELECT Amount__c, Date_of_Service__c
        FROM Services_and_Support_Plan__c
        WHERE Client__c = :clientId
        AND Funds_Tracker__c = :fundTrackerId
        AND Amount__c != null
        AND Date_of_Service__c >= :minStart
        AND Date_of_Service__c <= :maxEnd
    ];

    // =====================================================
    // 🔑 STEP 1: FINALISE STATUS FIRST (CRITICAL)
    // =====================================================
    Date today = Date.today();

    for (fund_split__c p : periods) {
        if (p.End_Date__c < today) {        p.Status__c = 'Completed';
        }
        else if (p.Start_Date__c <= today && p.End_Date__c >= today) {        p.Status__c = 'Active';
        }
        else {
            p.Status__c = 'Future';
        }
    }

    // 🔑 SAFETY NET (6 / 12 periods edge-case)
    Boolean hasActive = false;
    for (fund_split__c p : periods) {
        if (p.Status__c == 'Active') {  hasActive = true;        break;
        }
    }

    if (!hasActive) {
        for (fund_split__c p : periods) {
            if (p.Status__c == 'Future') {
                p.Status__c = 'Active';
                break;
            }
        }
    }
	Map<Id, fund_split__c> oldMapSpent = new Map<Id, fund_split__c>([
                                                                    SELECT Id, Spent_Amount__c
                                                                    FROM fund_split__c
                                                                    WHERE Id IN :periods
                                                                ]);
    // =====================================================
    // 🔑 STEP 2: CALCULATE SPENT + CARRY FORWARD
    // =====================================================
    for (fund_split__c period : periods) {

        Decimal spent = 0;

      /*  for (Services_and_Support_Plan__c s : services) {
            if (
                s.Date_of_Service__c >= period.Start_Date__c &&
                s.Date_of_Service__c <= period.End_Date__c
            ) {
                spent += s.Amount__c;
            }
        }*/
      /*   if (period.Status__c != 'Completed') {
        for (Services_and_Support_Plan__c s : services) {
            if (
                s.Date_of_Service__c >= period.Start_Date__c &&
                s.Date_of_Service__c <= period.End_Date__c
            ) {
                spent += s.Amount__c;
            }
        }
        period.Spent_Amount__c = spent;
    } */
      if (period.Status__c == 'Completed') {

    Decimal oldSpent =
        oldMapSpent.containsKey(period.Id)
        ? oldMapSpent.get(period.Id).Spent_Amount__c
        : null;

    if (oldSpent != null && oldSpent > 0) {
        // 🔒 Preserve historical value
        period.Spent_Amount__c = oldSpent;
    }
    else {
        // 🛠 First-time completion → calculate once
       // Decimal spent = 0;
        for (Services_and_Support_Plan__c s : services) {
            if (
                s.Date_of_Service__c >= period.Start_Date__c &&
                s.Date_of_Service__c <= period.End_Date__c
            ) {
                spent += s.Amount__c;
            }
        }
        period.Spent_Amount__c = spent;
    }
}
else {
    // Active / Future → always recalc
   // Decimal spent = 0;
    for (Services_and_Support_Plan__c s : services) {
        if (
            s.Date_of_Service__c >= period.Start_Date__c &&
            s.Date_of_Service__c <= period.End_Date__c
        ) {
            spent += s.Amount__c;
        }
    }
    period.Spent_Amount__c = spent;
}

        
                
                
        
        
        // 🔒 Preserve historical spend
     /*   if (period.Status__c == 'Completed' && oldMapSpent.containsKey(period.Id)) {
            period.Spent_Amount__c = oldMapSpent.get(period.Id).Spent_Amount__c;
        } else {
            period.Spent_Amount__c = spent;
        } */

        Decimal allocated = period.Allocated__c == null ? 0 : period.Allocated__c;

        // 🔑 Carry forward ONLY for Active period
        if (period.Status__c == 'Active' && period.Spent_Amount__c > 0) {
            period.Carry_Forward__c =
                Math.max(0, allocated - period.Spent_Amount__c);
        } else {
            period.Carry_Forward__c = 0;
        }
    }

    // =====================================================
    // 🔑 STEP 3: ROLL FORWARD WHEN PERIOD COMPLETES
    // =====================================================
    for (Integer i = 0; i < periods.size() - 1; i++) {
        fund_split__c current = periods[i];
        fund_split__c nextPeriod = periods[i + 1];

        if (current.Status__c == 'Completed') {

            Decimal rollAmount;

            if (current.Spent_Amount__c > 0) {
                // normal carry forward
                rollAmount = current.Carry_Forward__c;
            } else {
                // untouched allocation
                rollAmount = current.Allocated__c == null ? 0 : current.Allocated__c;
            }

            if (rollAmount > 0) {
                nextPeriod.Allocated__c =
                    (nextPeriod.Allocated__c == null ? 0 : nextPeriod.Allocated__c)
                    + rollAmount;

                current.Carry_Forward__c = 0;
            }

            if (nextPeriod.Status__c == 'Future') {
                nextPeriod.Status__c = 'Active';
            }
        }
    }

    update periods;
    return periods;
}
 
    
    
    

  //Vamshi for Quote generation
	// 1) GET CLIENT DETAILS (for editing/view)
    // =============================================
    @AuraEnabled
    public static List<Client__c> getClientDetails(String searchTerm, Id facilityId) {

        System.debug('searchTerm'+searchTerm);
        System.debug('facilityId'+facilityId);
        User objUser = [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;
        if (String.isBlank(searchTerm)) {
            return [
                SELECT Id, Name, Email__c, Contact_Number__c, State__c,First_Name__c,Status__c,
                    Last_Name__c,Company__c,NDIS_Participant_ID__c,(SELECT QuotePdf_Url__c, Id FROM NDIS_Quotes__r),
                    (
                        SELECT Id, Facility__c, Facility__r.Name
                        FROM Participant_Facilities__r
                        WHERE Active__c = true
                        AND Facility__c = :facilityId
                        LIMIT 1
                    )
                FROM Client__c where Status__c = true  AND Facility__r.Organisation__c =:orgID
                ORDER BY Name 
                
            ];
        }

    String pattern = '%' + searchTerm + '%';

    // return [
    //     SELECT Id, Name, Email__c, Contact_Number__c,
    //     State__c,First_Name__c,
    //             Last_Name__c,Company__c,NDIS_Participant_ID__c,(SELECT QuotePdf_Url__c, Id FROM NDIS_Quotes__r)
    //         FROM Client__c
    //         WHERE Name LIKE :pattern
    //         OR Email__c LIKE :pattern
    //         OR Contact_Number__c LIKE :pattern
    //         ORDER BY Name
        
    // ];
     return [
        SELECT Id, Name, Email__c, Contact_Number__c, State__c,
               First_Name__c, Status__c, Last_Name__c,
               Company__c, NDIS_Participant_ID__c,
               (SELECT QuotePdf_Url__c, Id FROM NDIS_Quotes__r), (
                        SELECT Id, Facility__c, Facility__r.Name
                        FROM Participant_Facilities__r
                        WHERE Active__c = true
                        AND Facility__c = :facilityId
                        LIMIT 1
                    )
        FROM Client__c
        WHERE Status__c = true
        AND Facility__r.Organisation__c = :orgID
        AND (
            Name LIKE :pattern
            OR Email__c LIKE :pattern
            OR Contact_Number__c LIKE :pattern
        )
        ORDER BY Name
    ];
    
    }    
    	 // =============================================
    // GET CLIENT DETAILS (for edit/view)
    // =============================================
    @AuraEnabled
    public static Client__c getClients(Id clientId) {

        if (clientId == null) {
            return null;
        }
             User objUser = [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;
        return [
            SELECT Id, Name,Display_Nickname__c,First_Name__c,
            Last_Name__c,State__c, Email__c, Contact_Number__c, Organization_Name__c,
            NDIS_Participant_ID__c,(SELECT QuotePdf_Url__c, Id FROM NDIS_Quotes__r)
            FROM Client__c 
            WHERE Id = :clientId AND Facility__r.Organisation__c =:orgID
        ];
    }
	// =============================================
    // 2) CREATE CLIENT
    // =============================================
    @AuraEnabled
    public static Client__c createClient(Client__c newClient) {

        if (newClient == null) {
            throw new AuraHandledException('No data received from LWC');
        }

        insert newClient;

        // Return freshly inserted record
        return [
            SELECT Id, Name, State__c, Email__c, Contact_Number__c, Organization_Name__c,Display_Nickname__c
            FROM Client__c
            WHERE Id = :newClient.Id
            LIMIT 1
        ];
    }


    // =============================================
    // 3) UPDATE CLIENT
    // =============================================
    @AuraEnabled
    public static Client__c updateClient(Client__c clientToUpdate) {

        if (clientToUpdate == null || clientToUpdate.Id == null) {
            throw new AuraHandledException('Invalid record for update.');
        }

        update clientToUpdate;

        // Return updated record for UI sync
        return [
            SELECT Id, Name, State__c, Email__c, Contact_Number__c, Organization_Name__c
            FROM Client__c
            WHERE Id = :clientToUpdate.Id
            LIMIT 1
        ];
    }
    
    // Getting Catalogue and Support Items Data based on States
		/* @AuraEnabled(cacheable=true)
    public static Map<String, Object> getNDISData() {

        Map<String, Object> response = new Map<String, Object>();

        List<NDIS_Support_Catalogue__c> records = [
            SELECT Id, Name, ACT__c, NSW__c, VIC__c, NT__c, QLD__c,
                   SA__c, TAS__c, WA__c,
                   Support_Item_Name__c, Support_Item_Number__c
            FROM NDIS_Support_Catalogue__c
            ORDER BY Name, Support_Item_Name__c
        ];

        // Final structure: Map<ServiceType, Map<SupportItem, Data>>
        Map<String, Map<String, Object>> master = new Map<String, Map<String, Object>>();

        for (NDIS_Support_Catalogue__c rec : records) {

            // Step 1: Category (Service Type)
            if (!master.containsKey(rec.Name)) {
                master.put(rec.Name, new Map<String, Object>());
            }

            Map<String, Object> supportMap = master.get(rec.Name);

            // Step 2: Support Item
            Map<String, Object> itemData = new Map<String, Object>();
            itemData.put('id', rec.Id); 
            itemData.put('name', rec.Support_Item_Name__c);
            itemData.put('code', rec.Support_Item_Number__c);

            // Step 3: State-mapped prices (currency)
            Map<String, Decimal> priceMap = new Map<String, Decimal>();
            priceMap.put('New South Wales', rec.NSW__c);
            priceMap.put('Victoria',       rec.VIC__c);
            priceMap.put('Queensland',     rec.QLD__c);
            priceMap.put('Western Australia', rec.WA__c);
            priceMap.put('South Australia', rec.SA__c);
            priceMap.put('Tasmania',        rec.TAS__c);
            priceMap.put('Australian Capital Territory', rec.ACT__c);
            priceMap.put('Northern Territory', rec.NT__c);
            // Add remote states as needed

            itemData.put('prices', priceMap);

            supportMap.put(rec.Support_Item_Name__c, itemData);
        }

        response.put('catalogue', master);
        System.debug('MAP RESPONSE..'+ response);
        return response;
    } */
    @AuraEnabled(cacheable=true)
public static Map<String, Object> getNDISData(String ServiceDate) {

    Map<String, Object> response = new Map<String, Object>();

    /* =========================
       1️⃣ Resolve effective date
       ========================= */
    Date sDate;
    if (String.isNotBlank(ServiceDate)) {
        sDate = Date.valueOf(ServiceDate);
    } else {
        sDate = Date.today();
    }

    /* =========================
       2️⃣ Calculate FY start (1 July)
       ========================= */
    Integer inputYear = sDate.year();
    Integer fyStartYear;

    if (sDate < Date.newInstance(inputYear, 7, 1)) {
        fyStartYear = inputYear - 1;
    } else {
        fyStartYear = inputYear;
    }

    Date financialStartDate = Date.newInstance(fyStartYear, 7, 1);

    System.debug(' Using Financial Year Start: ' + financialStartDate);

    /* =========================
       3️⃣ Fetch catalogue (FY filtered)
       ========================= */
    List<NDIS_Support_Catalogue__c> records = [
        SELECT Id, Name,
               ACT__c, NSW__c, VIC__c, NT__c, QLD__c,
               SA__c, TAS__c, WA__c,
               Support_Item_Name__c, Support_Item_Number__c
        FROM NDIS_Support_Catalogue__c
        WHERE Start_Date__c = :financialStartDate
        ORDER BY Name, Support_Item_Name__c
    ];

    /* =========================
       4️⃣ Build EXISTING response structure (UNCHANGED)
       ========================= */
    Map<String, Map<String, Object>> master =
        new Map<String, Map<String, Object>>();

    for (NDIS_Support_Catalogue__c rec : records) {

        // 🔹 Service Type
        if (!master.containsKey(rec.Name)) {
            master.put(rec.Name, new Map<String, Object>());
        }

        Map<String, Object> supportMap = master.get(rec.Name);

        // 🔹 Support Item
        Map<String, Object> itemData = new Map<String, Object>();
        itemData.put('id', rec.Id);
        itemData.put('name', rec.Support_Item_Name__c);
        itemData.put('code', rec.Support_Item_Number__c);

        // 🔹 State prices
        Map<String, Decimal> priceMap = new Map<String, Decimal>();
        priceMap.put('New South Wales', rec.NSW__c);
        priceMap.put('Victoria', rec.VIC__c);
        priceMap.put('Queensland', rec.QLD__c);
        priceMap.put('Western Australia', rec.WA__c);
        priceMap.put('South Australia', rec.SA__c);
        priceMap.put('Tasmania', rec.TAS__c);
        priceMap.put('Australian Capital Territory', rec.ACT__c);
        priceMap.put('Northern Territory', rec.NT__c);

        itemData.put('prices', priceMap);

        supportMap.put(rec.Support_Item_Name__c, itemData);
    }

    response.put('catalogue', master);

    System.debug('📦 NDIS Catalogue response ready');

    return response;
}
      
    
    @AuraEnabled(cacheable=true)
            public static Organisation__c getOrganisation() {
                return [
                    SELECT
                        Id,
                        Name,
                        ABN__c,
                        NDIS_Provider__c,
                        Address__c,
                        Email__c,
                        Contact_No__c
                    FROM Organisation__c
                    LIMIT 1
                ];
}
      
 
}