public class ChartOfAccounts {
    @AuraEnabled(cacheable=true)
    public static list<Chart_of_Accounts__c> getKeyWords(string orgName){
        list<Chart_of_Accounts__c>getWordsList=[select id,Name,Organisation_Name__c,Key_Word__c,Type_of_Key__c,Date__c,Createdby.name,Account_Number__c,Account_Name__c 
                                                from Chart_of_Accounts__c where Organisation_Name__c=:orgName];
        return getWordsList;
    }
    @AuraEnabled
    public static void createRawData(string AccountsJsonString,string orgName){
        List<rawDataClassWrapper> rawdata = (List<rawDataClassWrapper>)System.JSON.deserialize(AccountsJsonString,List<rawDataClassWrapper>.class);
        list<Final_Accounts_Data__c> rawDatalist = new list<Final_Accounts_Data__c>();
        
        for(rawDataClassWrapper rd:rawdata){
           Final_Accounts_Data__c ar= new Final_Accounts_Data__c();
            ar.Date__c=rd.dateofAccount;
            ar.Amount__c=rd.Amount;
            ar.Description__c=rd.Description;
            ar.Account_Name__c=rd.Accountname;
            ar.Account_Number__c=rd.AccountNumber;
            ar.Category__c=rd.Category;
            ar.Organisation_Name__c=orgName;
            rawDatalist.add(ar);  
        }
        if(rawDatalist.size()>0){
            insert rawDatalist;
        }
    } 
    @AuraEnabled(cacheable=true)
    public static list<Final_Accounts_Data__c> getFinalAccountsdata(string startDate,string endDate,string orgName){
        date sDate=Date.valueof(startDate);
        date eDate=Date.valueof(endDate);
        list<Final_Accounts_Data__c> FinalAccountsData=[select id,Date__c,Amount__c,Description__c,Account_Name__c,Account_Number__c,Category__c from Final_Accounts_Data__c where 
                                                       Date__c >= :sDate and Date__c <=:eDate and  Organisation_Name__c=:orgName];
        system.debug('final account data '+FinalAccountsData);
        return FinalAccountsData;
        
    }
    

    public class rawDataClassWrapper{
        public Date dateofAccount;
        public Decimal Amount;
        public string Description;
        public string AccountName;
        public string AccountNumber;
        public string Category;
    }
}