public class RosterInvoicesHandler {
    @AuraEnabled
    public static map<string,object> getCompanyAndAccountData(list<string> participantIdList){
        map<string,object> companyAndAccountResponse= new map<string,object>();
        try{
            // system.debug('particiapntid list '+participantIdList);
            list<Client__c> participnatData=[select id,Facility__r.Name,Facility__r.ABN__c,Facility_Email__c,First_Name__c,Last_Name__c,Name__c   from Client__c where Id in:participantIdList];
            set<String>facNameList=new set<string>();
            map<string,String> ClientCompanyMap = new map<String,String>();
            map<String,string> EmailCompanyIdMap = new map<string,string>();
            map<string,Accounting_Ledger_Items__c> AccountMap= new map<string,Accounting_Ledger_Items__c>();
            map<string,Accounting_Ledger_Items__c> EmmialAccountMap= new map<string,Accounting_Ledger_Items__c>();
            
            for(Client__c cc:participnatData){
                facNameList.add(string.valueof(cc.Facility__r.Name));
                ClientCompanyMap.put(cc.Id,'NoData ' + cc.Name__c);
                AccountMap.put(cc.Id, new Accounting_Ledger_Items__c() );
            }
           // system.debug('participnatData '+participnatData);
           // system.debug('facNameList list '+facNameList);
            List<Company__c> compList = [SELECT Id,Company_Name__c, ABN__c,Email__c FROM Company__c WHERE Company_Name__c In :facNameList ];
            system.debug('compList list '+compList);
            set<ID> companyIdList= new set<Id>();
            for(Company__c cp:compList){
                EmailCompanyIdMap.put(cp.Email__c,cp.Id); 
                companyIdList.add(cp.Id);
            }
            List<Accounting_Ledger_Items__c> ledgerItems = [
                SELECT Id, Name, Category__r.Name,Account_Number__c,Category__r.Account_List__r.Company__c,Category__r.Account_List__r.Company__r.Email__c
                FROM Accounting_Ledger_Items__c
                WHERE Category__r.Name ='Income' AND Category__r.Account_List__r.Company__c in :companyIdList
            ];
            for(Accounting_Ledger_Items__c ale:ledgerItems){
                EmmialAccountMap.put(ale.Category__r.Account_List__r.Company__r.Email__c,ale); 
            }
            system.debug('ledgerItems '+ledgerItems);
           // system.debug('ClientCompanyMap '+ClientCompanyMap);
          //  system.debug('EmailCompanyIdMap '+EmailCompanyIdMap);
            for (Client__c cc : participnatData) {
                // Only try to fetch companyId if Facility__r and Email__c are not null
                if (cc.Facility_Email__c !='' && cc.Facility_Email__c !=null ){
                    system.debug(' with in if ' +cc.Facility_Email__c);
                    String companyId = '';
                    companyId = EmailCompanyIdMap.get(cc.Facility_Email__c);
                    ClientCompanyMap.put(cc.Id, companyId !=null ?companyId :'NoData ' + cc.First_Name__c +' '+cc.Last_Name__c);
                    AccountMap.put(cc.Id,EmmialAccountMap.get(cc.Facility_Email__c) !=null ?EmmialAccountMap.get(cc.Facility_Email__c) :new Accounting_Ledger_Items__c() );
                }
            }
            //system.debug('ClientCompanyMap1 '+ClientCompanyMap);
            companyAndAccountResponse.put('ClientCompany',ClientCompanyMap); 
            companyAndAccountResponse.put('AccountList',AccountMap);  
            companyAndAccountResponse.put('isSuccess',true) ;
            
        }catch(exception e){ 
            companyAndAccountResponse.put('isSuccess',false) ;
            companyAndAccountResponse.put('message',e.getMessage()) ;
        }
        return  companyAndAccountResponse;
    }
    @AuraEnabled(cacheable=true)
    public static List<Accounting_Invoices_Expenses__c> getBulkServicesHandler(List<String> PartcipantIdList, String sDate, String eDate, string orgid,string name) {
        System.debug('=====> Method getBulkServicesHandler called');
        System.debug('=====> orgid: ' + orgid);
        System.debug('=====> PartcipantIdList: ' + PartcipantIdList);
        System.debug('=====> sDate (String): ' + sDate);
        System.debug('=====> eDate (String): ' + eDate);
        
        String baseQuery = 'SELECT Id, Name, Company__c, Status__c, GST__c, Total_Amount__c, ' +
            'Company__r.Company_Name__c, Invoice_Date__c, Amazon_URL__c, Is_Payroll_Sales__c,Participant__r.Facility__c, ' +
            'Participant__r.First_Name__c, Participant__r.Last_Name__c,Participant__r.Name__c ' +
            'FROM Accounting_Invoices_Expenses__c WHERE Is_Service_Invoice__c = true AND Company__r.Organization__c=:orgid';
        
        if (PartcipantIdList != null && !PartcipantIdList.isEmpty()) {
            System.debug('=====> Adding Participant__c filter to query');
            baseQuery += ' AND Participant__c IN :PartcipantIdList';
        }
        Date startDate = !String.isBlank(sDate) ? Date.valueOf(sDate) : null;
        Date endDate = !String.isBlank(eDate) ? Date.valueOf(eDate) : null;
        
        System.debug('=====> Parsed startDate: ' + startDate);
        System.debug('=====> Parsed endDate: ' + endDate);
        
        if (startDate != null && endDate != null) {
            System.debug('=====> Adding date range filter to query');
            baseQuery += ' AND Invoice_Date__c >= :startDate AND Invoice_Date__c <= :endDate';
        } 
        if(name !=null && name.trim() != '' ){           
            baseQuery  += ' AND Participant__r.Name__c LIKE \'%' + name + '%\'';
        }
        
        baseQuery += ' ORDER BY CreatedDate DESC';
        
        System.debug('=====> Final SOQL query: ' + baseQuery);
        
        List<Accounting_Invoices_Expenses__c> results = Database.query(baseQuery);
        System.debug('=====> Number of records fetched: ' + results.size());
        
        return results;
    }
    
    public static void updateChildServices(List<Accounting_Invoices_Expenses__c> ServicesList, Map<Id, Accounting_Invoices_Expenses__c> oldMap) {
        Set<String> allServiceIds = new Set<String>();
        Map<Id, Id> serviceToInvoiceMap = new Map<Id, Id>();
        
        // Step 1: Collect all Service IDs and link to their invoice
        for (Accounting_Invoices_Expenses__c aie : ServicesList) {
            if ((oldMap.get(aie.Id).Amazon_URL__c != aie.Amazon_URL__c) && 
                aie.Is_Service_Invoice__c == true && 
                String.isNotBlank(aie.Services_Id_List__c)) {
                    
                    List<String> serviceIds = aie.Services_Id_List__c.split(',');
                    for (String serviceId : serviceIds) {
                        allServiceIds.add(serviceId);
                        serviceToInvoiceMap.put(serviceId, aie.Id); // Map each Service to its parent Invoice
                    }
                }
        }
        
        // Step 2: Query all Services in one SOQL
        List<Services_and_Support_Plan__c> updatedServiceList = [
            SELECT Id, Status__c, Accounting_Invoices_Expenses__c 
            FROM Services_and_Support_Plan__c 
            WHERE Id IN :allServiceIds
        ];
        
        // Step 3: Update each Service
        for (Services_and_Support_Plan__c serv : updatedServiceList) {
            serv.Status__c = 'Invoice Generated';
            serv.Accounting_Invoices_Expenses__c = serviceToInvoiceMap.get(serv.Id); // Correct parent Invoice Id
        }
        
        // Step 4: DML update once
        if (!updatedServiceList.isEmpty()) {
            update updatedServiceList;
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Services_and_Support_Plan__c> serviceSupportList(List<String> clientIds, String startDateStr, String endDateStr ,string orgid ,string name,list<string> status) {
          String trucatedStr = string.valueof(orgid).substring(0,15);
        // Base query
        String query = 'SELECT Id, Client__c,Client__r.Name__c, Client__r.Facility__c, Client__r.First_Name__c, Client__r.Last_Name__c,Status__c,Resource_Name__c,Service_Type_Name__c,Description__c,GST__c, ' +
            'Client__r.Picture__c,Lineitem__c,Date_of_Service__c,Amount__c,Available_Fund__c,Unit_Price__c,Qty__c,Edited_Unit_Price__c FROM Services_and_Support_Plan__c WHERE Client__r.Facility__r.Organisation__c=:orgid AND Un_Assigned_Service__c=FALSE AND ';
        
        List<String> conditions = new List<String>();
         // Convert string to Date for binding
        Date startDate = !String.isBlank(startDateStr) ? Date.valueOf(startDateStr) : null;
        Date endDate = !String.isBlank(endDateStr) ? Date.valueOf(endDateStr) : null;
        
        // Add client filter if provided
        if (clientIds != null && clientIds.size()>0) {
            system.debug('clientIds ' +clientIds);
        
            conditions.add('Client__c IN : clientIds '  );
        }
        system.debug('name'  +name);
        if (name != null && name.trim() != '') {
            // OR condition for Full_Name__c or Resource_Name__c
            conditions.add('(Full_Name__c LIKE \'%' + String.escapeSingleQuotes(name) + 
                           '%\' OR Resource_Name__c LIKE \'%' + String.escapeSingleQuotes(name) + '%\')');
        }
        if (status != null && status.size()>0) { 
             conditions.add('Status__c IN:status ' );
        }
        
        
        SYSTEM.DEBUG('START DATE ' +startDateStr);
         SYSTEM.DEBUG('end DATE ' +endDateStr);
        // Add date filter if both dates are provided
        if (!String.isBlank(startDateStr) && !String.isBlank(endDateStr)) {
            conditions.add('Date_of_Service__c >= :startDate AND Date_of_Service__c <= :endDate');
        }
        
        if (conditions.isEmpty()) {
            return new List<Services_and_Support_Plan__c>();
        }
        
        // Final query
        query += String.join(conditions, ' AND ') + ' ORDER BY  Date_of_Service__c DESC ';
        
       
        // Return result
        return Database.query(query);
    }
      @AuraEnabled
    public static list<Add_shift__c> getAddShiftData(string AddShift){
        list<Add_shift__c> addShiftData =[select id,Start_Time_Text__c,End_Time_Text__c,Shift_Type__c,Start_Date__c from Add_shift__c where id=:AddShift ];
        return addShiftData;
    } 
      @AuraEnabled
    public static void updateQty (Id recordId, Decimal newQty){ 
         Services_and_Support_Plan__c acc = [SELECT Id, Client__c,Qty__c FROM Services_and_Support_Plan__c WHERE Id = :recordId LIMIT 1];
         acc.Qty__c = newQty;
        update acc;
    }
     @AuraEnabled
    public static List<Shift_Type__c> getShiftsTypeByFacility(Id facilityId) {
        if (String.isBlank(facilityId)) {
            return new List<Shift_Type__c>();
        }

        return [
            SELECT Id, Name, Start_Time__c, End_Time__c, Shift_Type__c,Facility__r.Type_of_Service__c,Colour__c, 
                   Type_of_Shift__c, Duration__c, Facility__c,(Select Id,Name,Custom_Shift_Type__c,Start_Time__c,Shift_Type__c,End_Time__c from Custom_Shift_Timings__r ORDER BY Index__c ASC)
            FROM Shift_Type__c
            WHERE Facility__c = :facilityId
        ];
    }
    
}