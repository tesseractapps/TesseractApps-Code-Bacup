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
   //
    @AuraEnabled(cacheable=false)
    public static List<fund_split__c> getFundSplits(Id fundTrackerId) {
        List<fund_split__c> fundsplitsList = new List<fund_split__c>();
    
        if (fundTrackerId != null && String.isNotBlank(fundTrackerId)) {
            fundsplitsList = [
                SELECT Id, Name, Funds_Tracker__c, Allocated__c, Carry_Forward__c,
                       Start_Date__c, End_Date__c, Status__c
                FROM fund_split__c
                WHERE Funds_Tracker__c = :fundTrackerId
                ORDER BY Start_Date__c ASC
            ];
        }
    
        System.debug('Returning fund splits for Tracker: ' + fundTrackerId + ' → ' + fundsplitsList.size());
        return fundsplitsList;
    }
    @AuraEnabled
    public static List<fund_split__c> saveFundSplits(Id fundTrackerId, List<fund_split__c> splits) {    
        try {    
            System.debug(' Entered saveFundSplits');    
            System.debug(' fundTrackerId: ' + fundTrackerId);    
            System.debug('️ Received Splits: ' + (splits == null ? 0 : splits.size()));     
            if (splits == null || splits.isEmpty()) {    
                throw new AuraHandledException('No fund split records to save.');    
            }     
            for (Integer i = 0; i < splits.size(); i++) {    
                fund_split__c fs = splits[i];     
                System.debug(' Incoming Record ' + (i + 1) + ': ' + JSON.serialize(fs));     
                // Ensure parent and Name    
                fs.Funds_Tracker__c = fundTrackerId;    
             /*   if (String.isBlank(fs.Name)) {
    
                    fs.Name = 'Period ' + String.valueOf(i + 1);
    
                } */     
                System.debug('Prepared for Save ' + (i + 1) + ': ' + JSON.serialize(fs));    
            }     
            //  Upsert handles both new & existing records
                upsert splits;     
            System.debug(' Upsert successful, retrieving updated records...');     
            // Fetch updated records
            List<fund_split__c> savedSplits = new List<fund_split__c>();     
            if (fundTrackerId != null && String.isNotBlank(fundTrackerId)) {    
                savedSplits = [    
                    SELECT Id, Name, Funds_Tracker__c, Allocated__c, Carry_Forward__c,
                               Start_Date__c, End_Date__c, Status__c    
                    FROM fund_split__c    
                    WHERE Funds_Tracker__c = :fundTrackerId    
                    ORDER BY Start_Date__c ASC    
                ];    
            }     
            System.debug(' Returning ' + savedSplits.size() + ' fund splits after save.');    
            return savedSplits;     
        } catch (Exception e) {
            System.debug(' Exception in saveFundSplits: ' + e.getMessage());
            System.debug(' Stack Trace: ' + e.getStackTraceString());
            throw new AuraHandledException('Error saving fund splits: ' + e.getMessage());    
        }    
    } 

}