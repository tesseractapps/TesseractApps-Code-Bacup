public class ActivityStatementHandler { 
    @AuraEnabled
    public static List<BAS_and_IAS__c> getActivityStatement(String recordId){ 
       // User objUser = [ SELECT Organization_Name__c FROM User WHERE Id = : UserInfo.getUserId() ];
       // string orgID = [Select id from Organisation__c where name=:objUser.Organization_Name__c limit 1].Id;  
         return [SELECT Id,Name,Amazon_URL__c,Form_Type__c,Start_Date__c,End_Date__c,Amount_Withheld_from_Payments_Shown__c,
                 Amount_Withheld_Where_no_ABN_is_Quoted__c,Client_Name__c,Document_Id__c,Nothing_due_or_Refundable__c,Other_Amounts_Withheld__c,ABN__c,
                 PAYG_Tax_Withheld__c,TFN__c,Total_Amounts_Withheld_W2_W4_W3__c,Total_Salary_Wages_and_Other_Payments__c FROM BAS_and_IAS__c Where Id =:recordId Order by createddate desc];
    }
    
    @AuraEnabled
    public static List<BAS_and_IAS__c> getStatementData(String formType, String startDate, String endDate){ 
        List<BAS_and_IAS__c> listBas = new List<BAS_and_IAS__c>();
        User objUser = [SELECT Organization_Name__c FROM User WHERE Id = :UserInfo.getUserId()];
        
        String orgName = [SELECT Id, Name FROM Organisation__c WHERE Name = :objUser.Organization_Name__c LIMIT 1].Name;
        
        // Start building the query dynamically
        String query = 'SELECT Id, Name, Amazon_URL__c, Form_Type__c, Start_Date__c, End_Date__c, Amount_Withheld_from_Payments_Shown__c, ' +
                       'Amount_Withheld_Where_no_ABN_is_Quoted__c, Client_Name__c, Document_Id__c, Nothing_due_or_Refundable__c, Other_Amounts_Withheld__c, ' +
                       'ABN__c, PAYG_Tax_Withheld__c, TFN__c, Total_Amounts_Withheld_W2_W4_W3__c, Total_Salary_Wages_and_Other_Payments__c ' +
                       'FROM BAS_and_IAS__c WHERE Client_Name__c = :orgName';        
        // Add conditions based on parameters
        if (formType != null && formType != '') {
            query += ' AND Form_Type__c = :formType';
        }        
        if (startDate != null && startDate != '') {
            date sDate = Date.valueof(startDate);
            query += ' AND Start_Date__c >= :sDate';
        }        
        if (endDate != null && endDate != '') {
            date eDate = Date.valueof(endDate);
            query += ' AND End_Date__c <= :eDate';
        }        
        query += ' ORDER BY CreatedDate DESC';
        System.debug('Query is >>'+query);
        listBas = Database.query(query);        
        return listBas;
    }
    
    @AuraEnabled
    public static List<Staff__c> fetchStaffByOrgId(){         
        User objUser = [ SELECT Organization_Name__c, Id FROM User WHERE Id = : UserInfo.getUserId() ];
        Organisation__c orgName = new Organisation__c();        
        if(!Test.isRunningTest())
            orgName = [select id,Name from Organisation__c where name=:objUser.Organization_Name__c];
        return [SELECT id,Name,Email_Address__c,AddressData__c,Status__c,
                Address__Street__s,Address__City__s,Address__StateCode__s,Address__CountryCode__s,Address__PostalCode__s
                FROM Staff__c where  Organization_Full_Name__c =: orgName.Name order by name asc];
    }
     @AuraEnabled(cacheable=true)
    public static List<Feedback__c> fetchFeedback(String clientId){
        return [SELECT ID,Feedback_UID__c,Staff__c,Rating__c,Staff__r.Name,Staff__r.Display_Nickname__c,Added_By__c,Comments__c,Created_Time__c,CreatedDate from Feedback__c where Added_By__c = :clientId order by createddate desc];
    }
   
}