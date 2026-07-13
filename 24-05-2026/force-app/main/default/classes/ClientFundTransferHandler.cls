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
        List<Funds_Tracker__c> fundList = [select id, Usage_Threshold__c,Amount_approved__c,Client__c,Plan_Type__c,Client_Name__c,Approved_Date__c,Available_Funds__c,Spent_Amt__c,Registration_Group__c,Status__c,State__c,(SELECT Id,NDIS_Support_Catalogue__r.Support_Item_Name__c,
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
            AND Registration_Group__c = :serviceType AND Status__c = 'Active'
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
   /* @AuraEnabled(cacheable=false)
    public static List<fund_split__c> getFundSplits(Id fundTrackerId) {
        List<fund_split__c> fundsplitsList = new List<fund_split__c>();
    
        if (fundTrackerId != null && String.isNotBlank(fundTrackerId)) {
            fundsplitsList = [
                SELECT Id, Name,  Usage_Threshold__c, Funds_Tracker__c, Allocated__c, Carry_Forward__c,
                       Start_Date__c, End_Date__c, Status__c, Spent_Amount__c
                FROM fund_split__c
                WHERE Funds_Tracker__c = :fundTrackerId
                ORDER BY Start_Date__c ASC
            ];
        
           
        }
        
        System.debug('Returning fund splits for Tracker: ' + fundTrackerId + ' → ' + fundsplitsList.size());
        return fundsplitsList;
    }*/

  @AuraEnabled
    public static List<fund_split__c> getFundSplits(
        Id fundTrackerId,
        Id clientId
    ) {
    
        List<fund_split__c> splits =
            new List<fund_split__c>();
    
        if (fundTrackerId == null) {
            return splits;
        }
    
        splits = [
            SELECT Id,
                   Name,
                   Usage_Threshold__c,
                   Funds_Tracker__c,
                   Allocated__c,
                   Carry_Forward__c,
                   Start_Date__c,
                   End_Date__c,
                   Status__c,
                   Spent_Amount__c
    
            FROM fund_split__c
    
            WHERE Funds_Tracker__c = :fundTrackerId
    
            ORDER BY Start_Date__c ASC
        ];
    
        if (splits.isEmpty()) {
            return splits;
        }
    
        List<Map<String,Object>> payload =
            new List<Map<String,Object>>();
    
        for (fund_split__c fs : splits) {
    
            payload.add(
                new Map<String,Object>{
    
                    'label'     => fs.Name,
                    'startDate' => String.valueOf(fs.Start_Date__c),
                    'endDate'   => String.valueOf(fs.End_Date__c)
                }
            );
        }
    
        Map<String, Decimal> spentMap =
            previewSpentForPeriods(
                clientId,
                fundTrackerId,
                payload
            );
    
        Date todayDate = Date.today();
    
        Boolean requiresUpdate = false;
    
        for (fund_split__c fs : splits) {
            Decimal dbSpent =
                fs.Spent_Amount__c != null
                    ? fs.Spent_Amount__c
                    : 0;
    
            Decimal latestSpent =
                spentMap.containsKey(fs.Name)
                    ? spentMap.get(fs.Name)
                    : 0;
    
            String expectedStatus;
    
            if (fs.End_Date__c != null && fs.End_Date__c < todayDate ) {
                expectedStatus = 'Completed';
            } else if (fs.Start_Date__c != null && fs.Start_Date__c <= todayDate && (fs.End_Date__c == null || fs.End_Date__c >= todayDate) ) {
                expectedStatus = 'Active';
            } else {
                expectedStatus = 'Future';
            }
            
            if (
                dbSpent != latestSpent || fs.Status__c != expectedStatus ) {
                requiresUpdate = true;
                break;
            }
        }
    
        if (!requiresUpdate) {
            System.debug('NO RECALCULATION REQUIRED');
            return splits;
        }
        Decimal previousCarry = 0;
        List<fund_split__c> updates = new List<fund_split__c>();
        for (Integer i = 0; i < splits.size(); i++) {
    
            fund_split__c fs = splits[i];
            
            // OWN BASE ALLOCATION
            Decimal ownAllocation =
                fs.Allocated__c != null
                    ? fs.Allocated__c
                    : 0;
    
            Decimal visibleAvailable =ownAllocation + previousCarry;
            Decimal latestSpent =
                spentMap.containsKey(fs.Name)
                    ? spentMap.get(fs.Name)
                    : 0;
    
            String newStatus;
    
            if (fs.End_Date__c != null && fs.End_Date__c < todayDate) {
                newStatus = 'Completed';
            } else if (fs.Start_Date__c != null && fs.Start_Date__c <= todayDate && (fs.End_Date__c == null || fs.End_Date__c >= todayDate )) {
                newStatus = 'Active';
            } else {
                newStatus = 'Future';
            }
    
            Decimal newCarry = 0;
            if (newStatus == 'Completed') {
                newCarry = visibleAvailable - latestSpent;
                previousCarry = newCarry;
            } else {
                previousCarry = 0;
            }
    
            fs.Carry_Forward__c = newCarry;
            fs.Spent_Amount__c = latestSpent;
            fs.Status__c = newStatus;
            updates.add(fs);
    
            System.debug('Period=' + fs.Name + ' | ownAllocation=' + ownAllocation + ' | visibleAvailable=' + visibleAvailable + ' | spent=' + latestSpent + ' | carry=' + newCarry );
        }
    
        if (!updates.isEmpty()) {
            update updates;
        }
        return [
            SELECT Id,
                   Name,
                   Usage_Threshold__c,
                   Funds_Tracker__c,
                   Allocated__c,
                   Carry_Forward__c,
                   Start_Date__c,
                   End_Date__c,
                   Status__c,
                   Spent_Amount__c
    
            FROM fund_split__c
            WHERE Funds_Tracker__c = :fundTrackerId
            ORDER BY Start_Date__c ASC
        ];
    }

   @AuraEnabled
    public static List<fund_split__c> saveFundSplits( Id fundTrackerId, List<fund_split__c> splits ) {
        try {
            if (fundTrackerId == null) {
                throw new AuraHandledException('Fund Tracker Id required');
            }
            if (splits == null || splits.isEmpty()) {
                throw new AuraHandledException( 'No fund split records to save.' );
            }
            for (fund_split__c fs : splits) {
                fs.Funds_Tracker__c = fundTrackerId;
                // Allocated__c already comes from JS baseAmount
            }
            upsert splits;
            
            return [
                SELECT Id,
                       Name,
                       Allocated__c,
                       Carry_Forward__c,
                       Start_Date__c,
                       End_Date__c,
                       Status__c,
                       Spent_Amount__c,
                       Usage_Threshold__c
    
                FROM fund_split__c
                WHERE Funds_Tracker__c = :fundTrackerId
                ORDER BY Start_Date__c ASC
            ];
        } catch (Exception e) {
            throw new AuraHandledException( 'Error saving fund splits: ' +  e.getMessage() );
        }
    }
    @AuraEnabled
    public static List<fund_split__c> updateFundSplits( Id fundTrackerId, List<fund_split__c> splits) {
        if (fundTrackerId == null) {
            throw new AuraHandledException('Fund Tracker Id is required.');
        }
        for (fund_split__c fs : splits) {
            fs.Funds_Tracker__c = fundTrackerId;
        }
    
        update splits;
    
        return [
            SELECT Id, Name, Funds_Tracker__c,
                   Allocated__c, Carry_Forward__c,Spent_Amount__c, Usage_Threshold__c,
                   Start_Date__c, End_Date__c, Status__c
            FROM fund_split__c
            WHERE Funds_Tracker__c = :fundTrackerId
            ORDER BY Start_Date__c
        ];
    }

  
  @AuraEnabled
  public static List<fund_split__c> replaceFundSplits(Id fundTrackerId,List<fund_split__c> newSplits ) {
        if (fundTrackerId == null) {
            throw new AuraHandledException('Fund Tracker Id is required.');
        }
        List<fund_split__c> oldSplits = [
            SELECT Id
            FROM fund_split__c
            WHERE Funds_Tracker__c = :fundTrackerId
        ];
      
        if (!oldSplits.isEmpty()) {
            delete oldSplits;
        }
    
        for (fund_split__c fs : newSplits) {
            fs.Id = null;
            fs.Funds_Tracker__c = fundTrackerId;
            // Allocated__c already baseAmount from JS
        }
        insert newSplits;
    
        return [
            SELECT Id,
                   Name,
                   Allocated__c,
                   Carry_Forward__c,
                   Start_Date__c,
                   End_Date__c,
                   Status__c,
                   Spent_Amount__c,
                   Usage_Threshold__c
    
            FROM fund_split__c
            WHERE Funds_Tracker__c = :fundTrackerId
            ORDER BY Start_Date__c ASC
        ];
    }
    //Period management- advancements
    /*
    1.Spent is always persisted and read-only.
    2.Carry forward is finalised only on period completion.
    3.Positive carry forward rolls into next active period.
    4.Overspend cascades into future periods.
    5.If total spend exceeds total allocation → block save.
    6.JS previews only; Apex is the source of truth - Actual data handling.    
   */
 
    

    @AuraEnabled(cacheable=false)
    public static Map<String, Decimal> previewSpentForPeriods(
        Id clientId, String fundTrackerId,
        List<Map<String, Object>> periods
    ) {
        
        if (clientId == null || fundTrackerId == null) {
        throw new AuraHandledException(
            'previewSpentForPeriods called without clientId or fundTrackerId'
        );
    }
        Date minStart;
        Date maxEnd;
    
        // Find global date range
        for (Map<String, Object> p : periods) {
            Date s = Date.valueOf((String)p.get('startDate'));
            Date e = Date.valueOf((String)p.get('endDate'));
    
            if (minStart == null || s < minStart) minStart = s;
            if (maxEnd == null || e > maxEnd) maxEnd = e;
        }
    
        if (minStart == null || maxEnd == null) {
            return new Map<String, Decimal>();
        }
    
        // Query only relevant services
        List<Services_and_Support_Plan__c> services = [
            SELECT Amount__c, Date_of_Service__c
            FROM Services_and_Support_Plan__c
            WHERE Client__c = :clientId
            AND Funds_Tracker__c = :fundTrackerId
            AND Amount__c != null
            AND Date_of_Service__c >= :minStart
            AND Date_of_Service__c <= :maxEnd
        ];
    
        //  Calculate spent per period
        Map<String, Decimal> result = new Map<String, Decimal>();
    
        for (Map<String, Object> p : periods) {
            String label = (String)p.get('label');
            Date startDate = Date.valueOf((String)p.get('startDate'));
            Date endDate   = Date.valueOf((String)p.get('endDate'));
    
            Decimal spent = 0;
            for (Services_and_Support_Plan__c s : services) {
                 System.debug('Checking Service → Date: ' + s.Date_of_Service__c + ' | Amount: ' + s.Amount__c);
                if (
                    s.Date_of_Service__c >= startDate &&
                    s.Date_of_Service__c <= endDate
                ) {
                    spent += s.Amount__c;
                    System.debug('✅ MATCHED → Adding Amount: ' + s.Amount__c + ' | Running Spent: ' + spent);
                }
            }
             System.debug(' TOTAL SPENT for ' + label + ' = ' + spent);
            result.put(label, spent);
        }
        System.debug(result);
        return result;
    }
    

    @AuraEnabled
    public static List<fund_split__c> recalculateFundPeriods(
        Id fundTrackerId,
        Id clientId
    ) {
        List<fund_split__c> periods = [
            SELECT Id, Name, Allocated__c, Carry_Forward__c,
                   Spent_Amount__c, Start_Date__c, End_Date__c, Status__c
            FROM fund_split__c
            WHERE Funds_Tracker__c = :fundTrackerId
            ORDER BY Start_Date__c
        ];
    
        if (periods.isEmpty()) return periods;
    
        Date minStart;
        Date maxEnd;
        for (fund_split__c p : periods) {
            if (minStart == null || p.Start_Date__c < minStart) minStart = p.Start_Date__c;
            if (maxEnd   == null || p.End_Date__c   > maxEnd)   maxEnd   = p.End_Date__c;
        }
    
        List<Services_and_Support_Plan__c> services = [
            SELECT Amount__c, Date_of_Service__c
            FROM Services_and_Support_Plan__c
            WHERE Client__c          = :clientId
            AND   Funds_Tracker__c   = :fundTrackerId
            AND   Amount__c          != null
            AND   Date_of_Service__c >= :minStart
            AND   Date_of_Service__c <= :maxEnd
        ];
    
        Date today = Date.today();
    
        // STEP 1: STATUS FROM DATES
        for (fund_split__c p : periods) {
            if (p.End_Date__c < today) {
                p.Status__c = 'Completed';
            } else if (p.Start_Date__c <= today && p.End_Date__c >= today) {
                p.Status__c = 'Active';
            } else {
                p.Status__c = 'Future';
            }
        }
    
        Boolean hasActive = false;
        for (fund_split__c p : periods) {
            if (p.Status__c == 'Active') { hasActive = true; break; }
        }
        if (!hasActive) {
            for (fund_split__c p : periods) {
                if (p.Status__c == 'Future') { p.Status__c = 'Active'; break; }
            }
        }
    
        // STEP 2: FRESH SPENT FROM SERVICES
        for (fund_split__c p : periods) {
            if (p.Start_Date__c == null || p.End_Date__c == null) {
                p.Spent_Amount__c = 0;
                continue;
            }
            Decimal spent = 0;
            for (Services_and_Support_Plan__c s : services) {
                if (s.Date_of_Service__c >= p.Start_Date__c &&
                    s.Date_of_Service__c <= p.End_Date__c) {
                    spent += s.Amount__c;
                }
            }
            p.Spent_Amount__c = spent;
        }
    
        // ✅ STEP 3: CHAIN CARRY — Allocated__c = base, totalAllocated = base + runningCarry
        // carry = totalAllocated - spent (always computed fresh, never from DB)
        Decimal runningCarry = 0;
    
        for (fund_split__c p : periods) {
            Decimal base  = p.Allocated__c    != null ? p.Allocated__c    : 0;
            Decimal spent = p.Spent_Amount__c != null ? p.Spent_Amount__c : 0;
    
            // ✅ carry-inclusive total
            Decimal totalAllocated = base + runningCarry;
    
            Decimal carry = 0;
            if (p.Status__c == 'Completed') {
                // ✅ always fresh — never reads old Carry_Forward__c from DB
                carry = totalAllocated - spent;
                if (carry < 0) carry = 0;
            }
    
            p.Carry_Forward__c = carry;
            runningCarry       = carry;
    
            System.debug('Period ' + p.Name +
                ' | base=' + base +
                ' | carryIn=' + (totalAllocated - base) +
                ' | totalAllocated=' + totalAllocated +
                ' | spent=' + spent +
                ' | carry=' + carry +
                ' | status=' + p.Status__c);
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
                  User objUser = [SELECT Id, Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
                String orgID = [SELECT Id FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Id;
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
                    WHERE Id = :orgID
                    
                ];
}
      
 //manendra
 @AuraEnabled
    public static List<String> checkThresholds(Id clientId) {

        List<String> breachedMessages = new List<String>();

        // 1. Fetch Funds
        List<Funds_Tracker__c> funds = [
            SELECT Id, Name, Usage_Threshold__c,
                   Amount_approved__c, Spent_Amt__c
            FROM Funds_Tracker__c
            WHERE Client__c = :clientId
        ];

        for (Funds_Tracker__c fund : funds) {

            if (fund.Amount_approved__c == 0) continue;

            Decimal usage = (fund.Spent_Amt__c / fund.Amount_approved__c) * 100;

            if (usage >= fund.Usage_Threshold__c) {
                String msg = 'Fund Level Breach → ' + fund.Name +
                             ' | Usage: ' + usage.setScale(0) + '%';
                System.debug(msg);
                breachedMessages.add(msg);
            }
        }

        // 2. Fetch Fund Splits
        List<fund_split__c> splits = [
            SELECT Id, Name, Usage_Threshold__c,
                   Allocated__c, Spent_Amount__c,
                   Funds_Tracker__r.Name
            FROM fund_split__c
            WHERE Funds_Tracker__r.Client__c = :clientId
            AND Status__c = 'Active'
        ];

        for (fund_split__c split : splits) {

            if (split.Allocated__c == 0) continue;

            Decimal usage = (split.Spent_Amount__c / split.Allocated__c) * 100;

            if (usage >= split.Usage_Threshold__c) {
                String msg = 'Period Breach → ' + split.Name +
                             ' (' + split.Funds_Tracker__r.Name + ')' +
                             ' | Usage: ' + usage.setScale(0) + '%';
                System.debug(msg);
                breachedMessages.add(msg);
            }
        }

        return breachedMessages;
    }

        @AuraEnabled
    public static void generateThresholdNotifications(Id clientId) {

        if (clientId == null) return;

        List<String> breachMessages = new List<String>();

        // 🔹 1. Fetch Fund Trackers
        List<Funds_Tracker__c> funds = [
            SELECT Id, Name, Usage_Threshold__c,
                   Amount_approved__c, Spent_Amt__c,client__r.Name
            FROM Funds_Tracker__c
            WHERE Client__c = :clientId
        ];
String participantName;

if (!funds.isEmpty() && funds[0].Client__r != null) {
    participantName = funds[0].Client__r.Name;
}
        for (Funds_Tracker__c fund : funds) {

            if (fund.Amount_approved__c == 0) continue;

            Decimal usage = (fund.Spent_Amt__c / fund.Amount_approved__c) * 100;

            if (usage >= fund.Usage_Threshold__c) {
                breachMessages.add(
                    fund.Name + ' – ' +
                    usage.setScale(0) + '% used (Threshold: ' +
                    fund.Usage_Threshold__c + '%)'
                );
            }
        }

        // 🔹 2. Fetch ONLY ACTIVE Periods
        List<fund_split__c> splits = [
            SELECT Id, Name, Usage_Threshold__c,
                   Allocated__c, Spent_Amount__c,
                   Status__c, Funds_Tracker__r.Name
            FROM fund_split__c
            WHERE Funds_Tracker__r.Client__c = :clientId
            AND Status__c = 'Active'
        ];

        for (fund_split__c split : splits) {

            if (split.Allocated__c == 0) continue;

            Decimal usage = (split.Spent_Amount__c / split.Allocated__c) * 100;

            if (usage >= split.Usage_Threshold__c) {
                breachMessages.add(
                    split.Name + ' (' + split.Funds_Tracker__r.Name + ') – ' +
                    usage.setScale(0) + '% used (Threshold: ' +
                    split.Usage_Threshold__c + '%)'
                );
            }
        }

        // 🔹 3. If no breaches → do nothing
        if (breachMessages.isEmpty()) {
            System.debug('No threshold breaches found.');
            return;
        }

        // 🔹 4. Build Description (line-separated)
        String description = String.join(breachMessages, '\n');

        // 🔹 5. Create Notification (CURRENT USER)
        My_Notification__c notification = new My_Notification__c(
            User__c = UserInfo.getUserId(),
            Subject__c = 'Fund Usage Alert – ' + participantName,
            Description__c = description
        );

        insert notification;

        System.debug('✅ Notification created: ' + description);
        User currentUser = [
    SELECT Id, Email, Name,Organization_Name__c
    FROM User
    WHERE Id = :UserInfo.getUserId()
    LIMIT 1
];
String orgName = currentUser.Organization_Name__c != null 
    ? currentUser.Organization_Name__c 
    : 'Your Organization';

// Format description into bullet points
String formattedDetails = '';
for (String msg : breachMessages) {
    formattedDetails += '• ' + msg + '<br/>';
}

// Build email body
String body = 
    'Hi ' + currentUser.Name + ',<br/><br/>' +
    'This is to inform you that one or more funding allocations for <b>' + participantName + '</b> ' +
    'have reached or exceeded the defined usage threshold.<br/><br/>' +
    
    '<b>Details:</b><br/>' +
    formattedDetails + '<br/>' +
    
    'Please review the funding allocations and take appropriate action if required.<br/><br/>' +
    
    '<b>Note:</b> This is an automated notification. Please do not reply.<br/><br/>' +
    
    'Regards,<br/>' +
     orgName;

// Create email
Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
email.setToAddresses(new List<String>{ currentUser.Email });
email.setSubject('Fund Usage Alert – ' + participantName);
email.setHtmlBody(body);

// Send email
Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ email });
    }
}