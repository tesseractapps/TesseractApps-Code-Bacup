public class RosterInvoicesHandler {
    @AuraEnabled
    public static map<string,object> getCompanyAndAccountData(list<string> participantIdList){
        map<string,object> companyAndAccountResponse= new map<string,object>();
        try{
             system.debug('particiapntid list '+participantIdList);
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
             system.debug('participnatData '+participnatData);
             system.debug('facNameList list '+facNameList);
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
             system.debug('ClientCompanyMap '+ClientCompanyMap);
              system.debug('EmailCompanyIdMap '+EmailCompanyIdMap);
            for (Client__c cc : participnatData) {
                // Only try to fetch companyId if Facility__r and Email__c are not null
                if (cc.Facility_Email__c !='' && cc.Facility_Email__c !=null ){
                    system.debug(' with in if ' +cc.Facility_Email__c);
                    String companyId = '';
                    companyId = EmailCompanyIdMap.get(cc.Facility_Email__c);
                    //ClientCompanyMap.put(cc.Id, companyId !=null ?companyId :'NoData ' + cc.First_Name__c +' '+cc.Last_Name__c);
                    ClientCompanyMap.put(cc.Id, companyId !=null ?companyId :'NoData ' + cc.Name__c);
                    AccountMap.put(cc.Id,EmmialAccountMap.get(cc.Facility_Email__c) !=null ?EmmialAccountMap.get(cc.Facility_Email__c) :new Accounting_Ledger_Items__c() );
                }
            }
            system.debug('ClientCompanyMap1 '+ClientCompanyMap);
            companyAndAccountResponse.put('ClientCompany',ClientCompanyMap); 
            companyAndAccountResponse.put('AccountList',AccountMap);  
            companyAndAccountResponse.put('isSuccess',true) ;
            
        }catch(exception e){ 
            companyAndAccountResponse.put('isSuccess',false) ;
            companyAndAccountResponse.put('message',e.getMessage()) ;
        }
        return  companyAndAccountResponse;
    }
  /* @AuraEnabled
    public static Map<String, Object> getCompanyAndAccountData1(
        List<Id> participantIdList,
        Id dashboardFacilityId
    ) {
        Map<String, Object> response = new Map<String, Object>();
    	System.debug('===== getCompanyAndAccountData1 START =====');
        System.debug('participantIdList: ' + participantIdList);
        System.debug('dashboardFacilityId: ' + dashboardFacilityId);
       
        try {
            // =====================================================
            //️⃣ Fetch participants with ACTIVE facilities (child)
            //==================================================== 
            List<Client__c> participants = [
                SELECT Id,Name__c,
                       (SELECT Facility__c,Active__c
                        FROM Participant_Facilities__r
                        WHERE Active__c = true)
                FROM Client__c
                WHERE Id IN :participantIdList
            ];
    		System.debug('Participants fetched: ' + participants.size());
        	System.debug('Participants : ' + participants);
            Map<Id, Client__c> participantMap = new Map<Id, Client__c>(participants);
            //=====================================================
            //⃣ Per participant, find matching facility
            //==================================================== 
            Map<Id, Id> participantMatchedFacilityMap = new Map<Id, Id>();
            Set<Id> matchedFacilityIds = new Set<Id>();
    
            for (Client__c p : participants) {
                System.debug('Processing Participant: ' + p.Id);
                for (Participant_Facility__c pf : p.Participant_Facilities__r) {
                    System.debug( '  Facility link → FacilityId: ' + pf.Facility__c + ' | Active: ' + pf.Active__c );
                    if (pf.Facility__c == dashboardFacilityId) {
                        participantMatchedFacilityMap.put(p.Id, dashboardFacilityId);
                        matchedFacilityIds.add(dashboardFacilityId);
                         System.debug('  ✔ MATCH FOUND for participant ' + p.Id + ' with facility ' + dashboardFacilityId);
                        break; // only ONE facility needed per participant
                    }
                }
            }
    		System.debug('participantMatchedFacilityMap: ' + participantMatchedFacilityMap);
        	System.debug('matchedFacilityIds: ' + matchedFacilityIds);
            //=====================================================
            //️⃣ Fetch Company for matched facilities
            //==================================================== 
            Map<Id, Id> facilityCompanyMap = new Map<Id, Id>();
    
            if (!matchedFacilityIds.isEmpty()) {
               List<Company__c> companies = [
                    SELECT Id, Facility__c
                    FROM Company__c
                    WHERE Facility__c IN :matchedFacilityIds
                ];
    
                System.debug('Companies fetched: ' + companies.size());
    
                for (Company__c c : companies) {
                    facilityCompanyMap.put(c.Facility__c, c.Id);
                    System.debug( 'Company mapped → Facility: ' + c.Facility__c +' → Company: ' + c.Id );
                }
            }
        	// FETCH COMPANY → ENTITY
            Map<Id, Id> companyEntityMap = new Map<Id, Id>();

            List<Company__c> companiesWithEntity = new List<Company__c>();
            if (!facilityCompanyMap.isEmpty()) {
                companiesWithEntity = [
                    SELECT Id,
                           (SELECT Id
                            FROM Entity_Profile__r
                            ORDER BY CreatedDate ASC
                            LIMIT 1)
                    FROM Company__c
                    WHERE Id IN :facilityCompanyMap.values()
                ];
            }
    
            for (Company__c c : companiesWithEntity) {
                if (c.Entity_Profile__r != null &&
                    !c.Entity_Profile__r.isEmpty()) {
    
                    companyEntityMap.put(
                        c.Id,
                        c.Entity_Profile__r[0].Id
                    );
                }
            }

            //=====================================================
            //️⃣ Fetch Income Ledger per Company
            //==================================================== 
            Map<Id, Accounting_Ledger_Items__c> companyLedgerMap =
                new Map<Id, Accounting_Ledger_Items__c>();
    
            if (!facilityCompanyMap.isEmpty()) {
                List<Accounting_Ledger_Items__c> ledgers = [
                    SELECT Id, Name, Account_Number__c,
                    Category__r.Name,
                    Category__r.Account_List__r.Company__c
                    FROM Accounting_Ledger_Items__c
                    WHERE Category__r.Name = 'Income'
                    AND Category__r.Account_List__r.Company__c
                    IN :facilityCompanyMap.values()
                ];
                
                System.debug('Ledger items fetched: ' + ledgers.size());
                
                for (Accounting_Ledger_Items__c li : ledgers) {
                    Id compId = li.Category__r.Account_List__r.Company__c;
                    companyLedgerMap.put(compId, li);
                    
                    System.debug(
                        'Ledger mapped → Company: ' + compId +
                        ' → LedgerId: ' + li.Id
                    );
                }
            }
    		Map<Id, Id> fundEntityMap = new Map<Id, Id>();
            Map<Id, Id> entityLedgerMap = new Map<Id, Id>();

            List<Funds_Tracker__c> fundTrackers = [
                SELECT Client__c, Entity_Profile__c, Entity_Profile__r.Accounting_Ledger_Items__c
                FROM Funds_Tracker__c
                WHERE Client__c IN :participantIdList
            ];
            
            for (Funds_Tracker__c ft : fundTrackers) {
                if (ft.Entity_Profile__c != null) {
                    fundEntityMap.put(ft.Id, ft.Entity_Profile__c); 
                    entityLedgerMap.put(
                        ft.Entity_Profile__c,
                        ft.Entity_Profile__r.Accounting_Ledger_Items__c
                    );
                }
            }
            //=====================================================
            //️⃣ Build per-participant response
            //==================================================== 
            Map<String, String> clientCompanyMap = new Map<String, String>();
            Map<String, Accounting_Ledger_Items__c> accountMap =
                new Map<String, Accounting_Ledger_Items__c>();
    		Map<String, String> participantFacilityMap = new Map<String, String>();
            for (Id pid : participantIdList) {
    
                if (!participantMatchedFacilityMap.containsKey(pid)) {
                    clientCompanyMap.put(
                        String.valueOf(pid),
                        'NoData ' + participantMap.get(pid).Name__c
                    );
                    System.debug('❌ Participant ' + pid + ': No matching facility');
                    continue;
                }
    
                Id facilityId = participantMatchedFacilityMap.get(pid);
                Id companyId = facilityCompanyMap.get(facilityId);
                participantFacilityMap.put( String.valueOf(pid), String.valueOf(facilityId) );
    
                if (companyId == null) {
                    clientCompanyMap.put(
                        String.valueOf(pid),
                       'NoData ' + participantMap.get(pid).Name__c
                    );
                    System.debug( '❌ Participant ' + pid + ': Facility matched but company missing' );
                    continue;
                }
    
                clientCompanyMap.put(String.valueOf(pid), String.valueOf(companyId));
                accountMap.put(
                    String.valueOf(pid),
                    companyLedgerMap.get(companyId)
                );
    
                System.debug('✅ Participant ' + pid + ' → Company ' + companyId +' → Ledger ' + companyLedgerMap.get(companyId));
            }
    		response.put('ParticipantFacility', participantFacilityMap);
            response.put('ClientCompany', clientCompanyMap);
            response.put('AccountList', accountMap);
            response.put('FundEntity', fundEntityMap); 
            response.put('EntityLedger', entityLedgerMap);
            response.put('CompanyEntity', companyEntityMap); 
            response.put('isSuccess', true);
    	
            System.debug('===== getCompanyAndAccountData1 SUCCESS =====');
    
        } catch (Exception e) {
            System.debug('❌ ERROR: ' + e.getMessage());
            System.debug(e.getStackTraceString());
    
            response.put('isSuccess', false);
            response.put('message', e.getMessage());
        }
    
        return response;
    }*/
    @AuraEnabled
    public static Map<String, Object> getCompanyAndAccountData1(
        List<Id> participantIdList,
        Id dashboardFacilityId
    ) {
        Map<String, Object> response = new Map<String, Object>();
    
        try {
            /* ===============================
               1️⃣ Participants + Facilities
            =============================== */
            List<Client__c> participants = [
                SELECT Id, Name__c,
                       (SELECT Facility__c FROM Participant_Facilities__r
                        WHERE Active__c = true)
                FROM Client__c
                WHERE Id IN :participantIdList
            ];
    
            Map<Id, Client__c> participantMap =
                new Map<Id, Client__c>(participants);
    
            Map<Id, Id> participantFacilityMap = new Map<Id, Id>();
            Set<Id> facilityIds = new Set<Id>();
    
            for (Client__c c : participants) {
                for (Participant_Facility__c pf : c.Participant_Facilities__r) {
                    if (pf.Facility__c == dashboardFacilityId) {
                        participantFacilityMap.put(c.Id, dashboardFacilityId);
                        facilityIds.add(dashboardFacilityId);
                    }
                }
            }
    
            /* ===============================
               2️⃣ Facility → Company
            =============================== */
            Map<Id, Id> facilityCompanyMap = new Map<Id, Id>();
            for (Company__c c : [
                SELECT Id, Facility__c
                FROM Company__c
                WHERE Facility__c IN :facilityIds
            ]) {
                facilityCompanyMap.put(c.Facility__c, c.Id);
            }
    
            /* ===============================
               3️⃣ Company → Entity
            =============================== */
            Map<Id, Id> companyEntityMap = new Map<Id, Id>();
    
            for (Company__c c : [
                SELECT Id,
                       (SELECT Id FROM Entity_Profile__r
                        ORDER BY CreatedDate ASC LIMIT 1)
                FROM Company__c
                WHERE Id IN :facilityCompanyMap.values()
            ]) {
                if (c.Entity_Profile__r != null &&
                    !c.Entity_Profile__r.isEmpty()) {
                    companyEntityMap.put(c.Id, c.Entity_Profile__r[0].Id);
                }
            }
    
            /* ===============================
               4️⃣ 🔥 FUNDS (ROW-LEVEL FIX)
            =============================== */
            Map<Id, Id> fundEntityMap   = new Map<Id, Id>(); 
            Map<Id, Id> entityLedgerMap = new Map<Id, Id>();
    
            List<Funds_Tracker__c> funds = [
                SELECT Id,
                       Client__c,
                       Entity_Profile__c,
                       Entity_Profile__r.Accounting_Ledger_Items__c
                FROM Funds_Tracker__c
                WHERE Client__c IN :participantIdList
            ];
    
            for (Funds_Tracker__c ft : funds) {
                if (ft.Entity_Profile__c != null) { fundEntityMap.put(ft.Id, ft.Entity_Profile__c);  entityLedgerMap.put( ft.Entity_Profile__c, ft.Entity_Profile__r.Accounting_Ledger_Items__c
                    );
                }
            }
    
            /* ===============================
               5️⃣ Build Response
            =============================== */
            Map<String, String> clientCompanyMap = new Map<String, String>();
    
            for (Id pid : participantIdList) {
                if (!participantFacilityMap.containsKey(pid)) {
                    clientCompanyMap.put(
                        String.valueOf(pid),
                        'NoData ' + participantMap.get(pid).Name__c
                    );
                    continue;
                }
    
                Id compId =
                    facilityCompanyMap.get(
                        participantFacilityMap.get(pid)
                    );
    
                if (compId == null) {  clientCompanyMap.put(  String.valueOf(pid),   'NoData ' + participantMap.get(pid).Name__c
                    ); continue;
                }
    
                clientCompanyMap.put(String.valueOf(pid), String.valueOf(compId));
            }
    
            response.put('ClientCompany', clientCompanyMap);
            response.put('ParticipantFacility', participantFacilityMap);
            response.put('CompanyEntity', companyEntityMap);
            response.put('FundEntity', fundEntityMap);           
            response.put('EntityLedger', entityLedgerMap);
            response.put('isSuccess', true);
    
        } catch (Exception e) {
            response.put('isSuccess', false);
            response.put('message', e.getMessage());
        }
    
        return response;
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
public static List<Services_and_Support_Plan__c> serviceSupportList(
    List<String> clientIds, 
    String startDateStr, 
    String endDateStr, 
    String orgid, 
    String name,          // ← This is now STAFF only
    List<String> status,
    String accountingService, 
    String planType, 
    Integer cacheBuster
) {
    System.debug('=====> name serviceSupportList (Staff Search): ' + name);
    String trucatedStr = String.valueOf(orgid).substring(0, 15);
    
    String query = 'SELECT Id, Client__c, Client__r.Name__c, ' +
        'Client__r.Facility__c, Client__r.First_Name__c, ' +
        'Client__r.Last_Name__c, Status__c, Resource_Name__c, ' +
        'Service_Type_Name__c, Description__c, GST__c, ' +
        'ShiftwithStaff__c, Bill_Participant__c, Cancel_Payment__c, ' +
        'Manual_Service_in_Manage_Invoice__c, Contractor_Name__c, ' +
        'Client__r.Picture__c, Lineitem__c, Date_of_Service__c, ' +
        'Amount__c, Available_Fund__c, Unit_Price__c, Qty__c, ' +
        'Edited_Unit_Price__c, Funds_Tracker__c, ' +
        'Funds_Tracker__r.Entity_Profile__c, ' +
        'Funds_Tracker__r.Xero_Entity__c, ' +
        'Funds_Tracker__r.Plan_Type__c, Reimbrusment_Support_item__c, Reimbrusment_line_item__c, Reimbrusment_Rate__c, Reimbrusment_Quantity__c, Reimbrusment_Amount__c,' +
        'Funds_Tracker__r.Xero_Entity__r.Xero_Contact_Id__c,(SELECT Id, Reimbrusement_Amount__c, Reimbrusment_line_item__c, Reimbrusment_Quantity__c, Reimbrusment_Rate__c, Reimbrusment_Support_item__c, Services_and_Support_Plan__c FROM ParticipantReimbrusements__r) ' +
        'FROM Services_and_Support_Plan__c ' +
        'WHERE Client__r.Facility__r.Organisation__c = :orgid ' +
        'AND Un_Assigned_Service__c = FALSE AND ';
    
    List<String> conditions = new List<String>();
    Date startDate = !String.isBlank(startDateStr) ? Date.valueOf(startDateStr) : null;
    Date endDate = !String.isBlank(endDateStr) ? Date.valueOf(endDateStr) : null;
    
    if (clientIds != null && clientIds.size() > 0) {
        conditions.add('Client__c IN :clientIds');
    }
    
    // ✅ CHANGED: Staff search only (removed Full_Name__c)
if (name != null && name.trim() != '') {
    conditions.add(
        '(Resource_Name__c LIKE \'%' + String.escapeSingleQuotes(name) + '%\'' +
        ' OR Contractor_Name__c LIKE \'%' + String.escapeSingleQuotes(name) + '%\')'
    );
}
    
    if (status != null && status.size() > 0) {
        List<String> quotedStatuses = new List<String>();
        for (String s : status) {
            quotedStatuses.add('\'' + String.escapeSingleQuotes(s) + '\'');
        }
        conditions.add('Status__c IN (' + String.join(quotedStatuses, ',') + ')');
    }
    
    if (accountingService == 'Xero') {
        conditions.add('Funds_Tracker__r.Xero_Entity__r.Xero_Contact_Id__c != null');
    }
    
    if (planType != null && planType != '') {
        conditions.add('Funds_Tracker__r.Plan_Type__c = :planType');
    }
    
    if (!String.isBlank(startDateStr) && !String.isBlank(endDateStr)) {
        conditions.add('Date_of_Service__c >= :startDate AND Date_of_Service__c <= :endDate');
    }
    
    if (!conditions.isEmpty()) {
        query += String.join(conditions, ' AND ');
    }
    
    query += ' ORDER BY Date_of_Service__c DESC';
    system.debug('=====> Final Query: ' + query);
    List<Services_and_Support_Plan__c> results = Database.query(query);
  
    System.debug('=====> Records fetched: ' + results.size());
    
    return results;
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
            SELECT Id, Name, Start_Time__c, End_Time__c, Shift_Type__c,Facility__r.Type_of_Service__c,Colour__c,Facility__r.Organisation__r.Enable_Time_Rounding__c,Type_of_Address__c, 
            Type_of_Shift__c, Duration__c, Facility__c,(Select Id,Name,Custom_Shift_Type__c,Start_Time__c,Duration__c,Shift_Type__c,End_Time__c from Custom_Shift_Timings__r ORDER BY Index__c ASC)
            FROM Shift_Type__c
            WHERE Facility__c = :facilityId
        ];
    }
    
    @AuraEnabled
    public static List<Entity_Profile__c> fetchEntity(Id facilityId) {
        system.debug('facilityId >>'+ facilityId);
        return [
            SELECT Id, Name, Card_Type__c, Designation__c, Name__c, First_Name__c, Last_Name__c, Company__c,Company__r.Company_Name__c, Company__r.Facility__c
            FROM Entity_Profile__c
            WHERE Company__r.Facility__c = :facilityId AND Card_Type__c = 'Customer'
        ];
    }
    
            @AuraEnabled(cacheable=true)
        public static Company__c fetchCompanyByFacility(Id facilityId) {
            List<Company__c> companies = [
                SELECT Id, Company_Name__c
                FROM Company__c
                WHERE Facility__c = :facilityId
                LIMIT 1
            ];
        
            if (!companies.isEmpty()) {
                return companies[0];
            }
            return null;
        }

    
    
    @AuraEnabled
    public static List<Funds_Tracker__c> fetchEntityfromFundtracker(Id fundTrackerId) {
        System.debug('⚡ FundTrackerId from LWC: ' + fundTrackerId);
        
        // 👉 You can now use fundTrackerId in your SOQL/filter logic if needed
        List<Funds_Tracker__c> items = [
            SELECT Id, Name, Entity_Profile__c,Xero_Entity__c, Shift_Name__c
            FROM Funds_Tracker__c
            WHERE Id = :fundTrackerId
        ];
        return items;
    }
    
    @AuraEnabled
    public static Boolean cancelInvoiceById(Id invoiceId) {
        try {
            Id currentUserId = UserInfo.getUserId();
            User u = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId];
            System.debug('u >> ' + u);
            Organisation__c org = [
                SELECT Id, Name, Email__c, Bank__c, Account_Name__c, BSB__c, Account_Number__c ,Accounting_Services__c
                FROM Organisation__c 
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];
            System.debug('org >> ' + org);
            String accountingService = org.Accounting_Services__c;
            System.debug('📘 Accounting Service: ' + accountingService);
            
            if (accountingService == 'Tesseract System') {
                // Query the invoice record (replace Invoice__c with your actual object API name)
                Accounting_Invoices_Expenses__c invoiceRecord = [SELECT Id, Status__c FROM Accounting_Invoices_Expenses__c WHERE Id = :invoiceId LIMIT 1];
                
                //if (invoiceRecord != null) {
                    invoiceRecord.Status__c = 'Cancelled';  // Set status to Cancelled
                    update invoiceRecord;
                    return true;  // Success
                //}
               
             } else if (accountingService == 'Xero') {
                Xero_or_Myob_Invoice__c xeroInvoiceRecord = [SELECT Id, Status__c FROM Xero_or_Myob_Invoice__c WHERE Id = :invoiceId LIMIT 1];
            
               // if (xeroInvoiceRecord != null) {
                    xeroInvoiceRecord.Status__c = 'Cancelled';  // Set status to Cancelled
                    update xeroInvoiceRecord;
                    return true;  
                //}
                //return false;  
             } else {
                 // Unknown accounting system
                 System.debug('⚠️ Unsupported Accounting Service: ' + accountingService);
                 return false;
             }
        } catch (Exception e) {
            // Log error or add custom error handling
            throw new AuraHandledException('Error cancelling invoice: ' + e.getMessage());
        }
    }
   
    @AuraEnabled
    public static List<Reimbursement__c> getReimbursementsByShiftStaffIds(List<Id> shiftStaffIds) {
        System.debug('✅ Received ShiftwithStaff__c Ids: ' + shiftStaffIds);

        return [
            SELECT Id, Name, Amount__c, ShiftwithStaff__c,Approval_Status__c,Mileage_Others__c,Mileage_Amount__c,Mileage_Bill__c,Service_Amount__c
            FROM Reimbursement__c
            WHERE ShiftwithStaff__c IN :shiftStaffIds
        ];
    }
    
	@AuraEnabled
    public static  Map<String, String> getEmailBodyServiceInvoice(
        Id invoiceid
        //String invoiceDate
    ) {
        Map<String, String> result = new Map<String, String>();
        try {
            System.debug('invoiceid >> ' + invoiceid);
            //System.debug('toAddress >> ' + toAddress);
            //System.debug('ccAddress >> ' + ccAddress);
            //System.debug('url >> ' + url);
            //Date parsedInvoiceDate = Date.valueOf(invoiceDate);
            //System.debug('invoiceDate >> ' + invoiceDate);
            
            // Get current user and organization
            Id currentUserId = UserInfo.getUserId();
            User u = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId];
            System.debug('u >> ' + u);
             Organisation__c org;
            org = [
                SELECT Id, Name, Email__c, Bank__c, Account_Name__c, BSB__c, Account_Number__c ,Accounting_Services__c
                FROM Organisation__c 
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];
            if (Test.isRunningTest()) {
                
                org = [
                    SELECT Id, Name, Email__c, Bank__c, Account_Name__c, BSB__c, Account_Number__c ,Accounting_Services__c
                    FROM Organisation__c 
                    LIMIT 1
            ];          
            }
            
            System.debug('org >> ' + org);
            String accountingService = org.Accounting_Services__c;
            System.debug('📘 Accounting Service: ' + accountingService);
            
            String invoiceNumber = '';
            String entityName = '';
            Decimal totalAmount = 0;
            Date invoiceDate;
            String invoiceName = '';
            if (accountingService == 'Tesseract System') {
                // Get Invoice Record
                Accounting_Invoices_Expenses__c AJE = [
                    SELECT Id,Company__r.Company_Name__c,Invoice_Date__c, Invoice_No__c, Total_Amount__c,Name,Due_Date__c,Email_Count__c,
                    (select Id,Entity_Profile__c, Entity_Profile__r.First_Name__c,
                     Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c
                     from Accounting_Journal_Entry__r)
                    FROM Accounting_Invoices_Expenses__c 
                    WHERE Id = :invoiceid
                ];
                System.debug('AJE >> ' + AJE);
                invoiceNumber = AJE.Invoice_No__c;
                invoiceDate = AJE.Invoice_Date__c;
                totalAmount = AJE.Total_Amount__c;
                invoiceName = AJE.Name;
                
                if (!AJE.Accounting_Journal_Entry__r.isEmpty()) { Entity_Profile__c entity = AJE.Accounting_Journal_Entry__r[0].Entity_Profile__r;if (entity != null) {if (!String.isBlank(entity.First_Name__c) || !String.isBlank(entity.Last_Name__c)) { entityName = (entity.First_Name__c != null ? entity.First_Name__c + ' ' : '') + (entity.Last_Name__c != null ? entity.Last_Name__c : '');} else {entityName = entity.Name__c;
                        }
                    }  } } else if (accountingService == 'Xero') { Xero_or_Myob_Invoice__c xeroInvoice = [  SELECT Id, Name,Invoice_No__c, Invoice_Date__c, Total_Amount__c,Email_Count__c, Xero_Entity__r.First_Name__c, Xero_Entity__r.Last_Name__c FROM Xero_or_Myob_Invoice__c  WHERE Id = :invoiceId LIMIT 1]; invoiceNumber = xeroInvoice.Invoice_No__c; invoiceDate = xeroInvoice.Invoice_Date__c; totalAmount = xeroInvoice.Total_Amount__c!=null ?xeroInvoice.Total_Amount__c :0;
                invoiceName = xeroInvoice.Name;
                 
                 Xero_Entity__c entity1 = xeroInvoice.Xero_Entity__r;
                 if (entity1 != null) {
                     if (!String.isBlank(entity1.First_Name__c) || !String.isBlank(entity1.Last_Name__c)) {
                         entityName = (entity1.First_Name__c != null ? entity1.First_Name__c + ' ' : '') +
                             (entity1.Last_Name__c != null ? entity1.Last_Name__c : '');
                     } 
                 }
                 System.debug('xeroInvoice >> ' + xeroInvoice);
             }
             String formattedIssueDate = formatDateDDMMYYYY(invoiceDate);   
                
             String subject =  'Invoice ' + invoiceName  + ' is generated on ' + formattedIssueDate;
            String safeEntityName       = entityName == null ? '' : entityName;
            String safeInvoiceName      = invoiceName == null ? '' : invoiceName;
            String safeFormattedDate    = formattedIssueDate == null ? '' : formattedIssueDate;
            Decimal safeTotalAmount     = totalAmount == null ? 0 : totalAmount;
            String safeOrgName          = (org == null || org.Name == null) ? '' : org.Name;
            String safeBankName         = (org == null || org.Bank__c == null) ? '' : org.Bank__c;
            String safeAccountName      = (org == null || org.Account_Name__c == null) ? '' : org.Account_Name__c;
            String safeBSB              = (org == null || org.BSB__c == null) ? '' : org.BSB__c;
            String safeAccountNumber    = (org == null || org.Account_Number__c == null) ? '' : org.Account_Number__c;
            
            // Now safely build the email body
            String body = 
                'Dear <b>' + safeEntityName + '</b>,<br/><br/>' +
                'Please find attached the tax invoice <b>' + safeInvoiceName + '</b> generated on <b>' + safeFormattedDate +
                '</b>, issued by <b>' + safeOrgName + '</b>.<br/><br/>' +
                
                '<b>Invoice Summary:</b><br/>' +
                '<b>Invoice Number:</b> ' + safeInvoiceName + '<br/>' +
                '<b>Date Issued:</b> ' + safeFormattedDate + '<br/>' +
                '<b>Total Amount:</b> $' + String.valueOf(safeTotalAmount.setScale(2)) + '<br/><br/>' +
                
                '<b>Bank Details:</b><br/>' +
                '<b>Bank Name:</b> ' + safeBankName + '<br/>' +
                '<b>Account Name:</b> ' + safeAccountName + '<br/>' +
                '<b>BSB:</b> ' + safeBSB + '<br/>' +
                '<b>Account Number:</b> ' + safeAccountNumber + '<br/><br/>' +
                
                'Kindly process the payment. If you have any questions or need further clarification, feel free to reach out.<br/><br/>' +
                'Thank you for your continued partnership.';
            
            System.debug('body >> ' + body);
             result.put('subject', subject);
             result.put('body', body);
             return result;
           
        } catch (Exception ex) {
            throw new AuraHandledException('Error sending invoice email: ' + ex.getMessage());
        }
    }
      @AuraEnabled
    public static Decimal sendEmailforServiceInvoice(Id invoiceid, String toAddress, String ccAddress, String url, String subject,String body) {
        try {
            System.debug('invoiceid >> ' + invoiceid);
            System.debug('toAddress >> ' + toAddress);
            System.debug('ccAddress >> ' + ccAddress);
            System.debug('url >> ' + url);
            //System.debug('subject >> ' + subject);
            //System.debug('body >> ' + body);
            // Get current user and organization
            Id currentUserId = UserInfo.getUserId();
            User u = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId];
            System.debug('u >> ' + u);
            
            Organisation__c org = [
                SELECT Id, Name, Email__c, Bank__c, Account_Name__c, BSB__c, Account_Number__c,Accounting_Services__c 
                FROM Organisation__c 
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];
            System.debug('org >> ' + org);
            String accountingService = org.Accounting_Services__c;
            System.debug('📘 Accounting Service: ' + accountingService);
    
            String invoiceName = '';
            Decimal emailCount;
            if (accountingService == 'Tesseract System') {
                // Get Invoice Record
                Accounting_Invoices_Expenses__c AJE = [
                    SELECT Id,Company__r.Company_Name__c,Invoice_Date__c, Invoice_No__c, Total_Amount__c,Name,Due_Date__c,Email_Count__c,
                    (select Id,Entity_Profile__c, Entity_Profile__r.First_Name__c,
                                Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c
                                from Accounting_Journal_Entry__r)
                    FROM Accounting_Invoices_Expenses__c 
                    WHERE Id = :invoiceid
                ];
                System.debug('AJE >> ' + AJE);
                invoiceName = AJE.Name;
                
                sendInvoiceEmail(invoiceName, toAddress, ccAddress, url, subject, body);
                AJE.Email_Count__c = (AJE.Email_Count__c == null) ? 1 : AJE.Email_Count__c + 1;
            	update AJE;

            	emailCount = AJE.Email_Count__c;

            } else if (accountingService == 'Xero') {
                Xero_or_Myob_Invoice__c xeroInvoice = [
                    SELECT Id, Name, Email_Count__c
                    FROM Xero_or_Myob_Invoice__c 
                    WHERE Id = :invoiceId
                    LIMIT 1
                ];
                invoiceName = xeroInvoice.Name;
    
                // === 2. Send email
                sendInvoiceEmail(invoiceName, toAddress, ccAddress, url, subject, body);
    
                // === 3. Update email count
                xeroInvoice.Email_Count__c = (xeroInvoice.Email_Count__c == null) ? 1 : xeroInvoice.Email_Count__c + 1;
                update xeroInvoice;
    
                emailCount = xeroInvoice.Email_Count__c;
    
            } else {
                throw new AuraHandledException('Unsupported Accounting Service: ' + accountingService);
            }
    
            return emailCount;
    
        } catch (Exception ex) {
            //throw new AuraHandledException('❌ Error sending invoice email: ' + ex.getMessage());
            return 0;
        }
    }
    
    public static void sendInvoiceEmail(String fileName, String toAddress, String ccAddress, String pdfUrl, String subject, String body) {
        // HTTP Callout to get PDF
        Http http = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(pdfUrl);
        req.setMethod('GET');
        req.setTimeout(60000);
        
        HttpResponse res = http.send(req);
        
        if (res.getStatusCode() != 200) {
            throw new AuraHandledException('Failed to download invoice PDF. Status code: ' + res.getStatusCode());
        }
        Blob fileBody = res.getBodyAsBlob();
        
        // Prepare email attachment
        Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
        attachment.setFileName(fileName+'.pdf');
        attachment.setBody(fileBody);
        attachment.setContentType('application/pdf');
        
        // Compose email
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        if (String.isNotBlank(toAddress)) {
            email.setToAddresses(toAddress.split('\\s*,\\s*'));
        }
        
       /* if (String.isNotBlank(ccAddress)) {
            email.setCcAddresses(new List<String>{ ccAddress });
        } */
        
        if (String.isNotBlank(ccAddress)) {
    		email.setCcAddresses(ccAddress.split('\\s*,\\s*'));
		}

        
        email.setSubject(subject);
        email.setHtmlBody(body);
        
        email.setFileAttachments(new List<Messaging.EmailFileAttachment>{ attachment });
        
        // Use Org-Wide Email Address from Custom Label
        List<OrgWideEmailAddress> oweList = [
            SELECT Id, Address 
            FROM OrgWideEmailAddress 
            WHERE Address = :System.Label.OrgWideEmailAddress 
            LIMIT 1
        ];
        if (!oweList.isEmpty()) {
            email.setOrgWideEmailAddressId(oweList[0].Id);
        } else {
            throw new AuraHandledException('No Org-Wide Email Address found for: ' + System.Label.OrgWideEmailAddress);
        }
        
        // Send the email
        Messaging.sendEmail(new List<Messaging.Email>{ email });
                
    } 
    
	 public static String formatDateDDMMYYYY(Date inputDate) {
        String day = inputDate.day() < 10 ? '0' + inputDate.day() : String.valueOf(inputDate.day());
        String month = inputDate.month() < 10 ? '0' + inputDate.month() : String.valueOf(inputDate.month());
        String year = String.valueOf(inputDate.year());
        return day + '/' + month + '/' + year;
    }
    
    @AuraEnabled
    public static Xero_or_Myob_Invoice__c createUpdateXeroInvoice(
        String salesEntryJson,
        String salesEntryListJson,
        String amountEntryJson,
        Boolean isParticipantInvoice
    ) {
        Xero_or_Myob_Invoice__c invoiceRecord = new Xero_or_Myob_Invoice__c();
        List<Xero_Invoice_Entries__c> journalEntriesToUpdate = new List<Xero_Invoice_Entries__c>();
        List<Xero_Invoice_Entries__c> journalEntriesToInsert = new List<Xero_Invoice_Entries__c>();

        try {

            System.debug('──────────────────────────────────────────────');
            System.debug('🔵 START createUpdateXeroInvoice');
            System.debug('🔵 isParticipantInvoice: ' + isParticipantInvoice);
            System.debug('──────────────────────────────────────────────');

            System.debug('➡ salesEntryJson: ' + salesEntryJson);
            System.debug('➡ salesEntryListJson: ' + salesEntryListJson);
            System.debug('➡ amountEntryJson: ' + amountEntryJson);

            // Deserialize input JSON
            Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
            Map<String, Object> amountEntry = (Map<String, Object>) JSON.deserializeUntyped(amountEntryJson);

            List<Object> rawList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);

            System.debug('🟦 Raw List (Before Conversion): ' + rawList);

            List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>();
            Set<Id> journalIds = new Set<Id>();

            for (Object obj : rawList) {
                Map<String, Object> entryMap = (Map<String, Object>) obj;
                salesEntryList.add(entryMap);

                System.debug('🟩 Converted Entry Map: ' + entryMap);

                if (entryMap.containsKey('Id') && entryMap.get('Id') != null) {
                    String journalId = String.valueOf(entryMap.get('Id'));
                    System.debug('➡ Checking JournalEntry ID: ' + journalId);

                    if (!String.isBlank(journalId) && (journalId.length() == 15 || journalId.length() == 18)) {
                        journalIds.add(journalId);
                    }
                }
            }

            System.debug('🟦 Final Parsed salesEntryList: ' + salesEntryList);
            System.debug('🟦 Journal IDs collected: ' + journalIds);

            Map<Id, Xero_Invoice_Entries__c> existingJournalEntryMap = new Map<Id, Xero_Invoice_Entries__c>();
            if (!journalIds.isEmpty()) {
                existingJournalEntryMap = new Map<Id, Xero_Invoice_Entries__c>(
                    [SELECT Id, Sl_no__c FROM Xero_Invoice_Entries__c WHERE Id IN :journalIds]
                );
            }

            // Build Invoice
            String invoiceId = String.valueOf(salesEntry.get('invoiceId'));
            Boolean isValidId = !String.isBlank(invoiceId) && (invoiceId.length() == 15 || invoiceId.length() == 18);

            System.debug('🟦 Existing InvoiceId: ' + invoiceId + ' | isValidId: ' + isValidId);

            Decimal subTotal = Decimal.valueOf(String.valueOf(amountEntry.get('subTotal')));
            Decimal taxAmount = Decimal.valueOf(String.valueOf(amountEntry.get('taxAmount')));
            Decimal totalAmount = Decimal.valueOf(String.valueOf(amountEntry.get('totalAmount')));

            System.debug('🟧 Invoice Amounts → subTotal: ' + subTotal + ' taxAmount: ' + taxAmount + ' total: ' + totalAmount);

            invoiceRecord = new Xero_or_Myob_Invoice__c(
                Invoice_Date__c    = Date.valueOf((String)salesEntry.get('InvoiceDate')),
                Invoice_No__c      = (String)salesEntry.get('InvoiceNo'),
                Status__c          = (String)salesEntry.get('Status'),
                GST__c             = taxAmount,
                Total_Amount__c    = totalAmount,
                Sub_Total__c       = subTotal,
                Invoice_Source__c  = 'Xero'
            );

            System.debug('🟩 Built Invoice Record (Before Insert/Update): ' + invoiceRecord);

            // Participant Invoice Details
            if (isParticipantInvoice == true) {
                invoiceRecord.Participant__c        = (String)salesEntry.get('participantID');
                invoiceRecord.Is_Service_Invoice__c = true;
                invoiceRecord.Services_Id_List__c   = (String)salesEntry.get('ServicesList');

                System.debug('🟦 Participant Invoice Fields Set.');
            }

            // Link Entity
            String entityId = (String)salesEntry.get('entityProfileId');
            invoiceRecord.Xero_Entity__c = entityId;

            System.debug('🟦 Linked Entity: ' + entityId);

            // UPDATING or INSERTING the Invoice
            if (isValidId) {
                invoiceRecord.Id = invoiceId;
                update invoiceRecord;
                System.debug('🟩 Updated Invoice: ' + invoiceRecord.Id);
            } else {
                insert invoiceRecord;
                System.debug('🟩 Inserted Invoice: ' + invoiceRecord.Id);

                invoiceRecord = [
                    SELECT Id, Name, Total_Amount__c, Invoice_No__c
                    FROM Xero_or_Myob_Invoice__c
                    WHERE Id = :invoiceRecord.Id
                ];

                if (String.isBlank(invoiceRecord.Invoice_No__c)) {
                    invoiceRecord.Invoice_No__c = invoiceRecord.Name;
                    update invoiceRecord;
                    System.debug('🟦 Assigned Auto Invoice_No__c: ' + invoiceRecord.Invoice_No__c);
                }
            }

            /* ───────────────────────────────────────────────
            PROCESS JOURNAL ENTRIES
            ─────────────────────────────────────────────── */
            for (Map<String, Object> entry : salesEntryList) {
                System.debug('🟨 Processing Journal Entry: ' + entry);

                String taxStr = String.valueOf(entry.get('tax')).replace('%', '');
                Decimal taxValue = Decimal.valueOf(taxStr);
                Decimal taxMultiplier = 1 + (taxValue / 100);

                Decimal unitPrice = Decimal.valueOf(String.valueOf(entry.get('Amount__c')));
                Decimal quantity = Decimal.valueOf(String.valueOf(entry.get('Quantity__c')));
                Boolean taxInclusive = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusive')));

                System.debug('🟦 unitPrice=' + unitPrice + ' quantity=' + quantity + ' tax=' + taxValue);

                Decimal baseTotal = (unitPrice * quantity).setScale(2);

                Decimal subTotalJE;
                Decimal taxAmountJE;
                Decimal totalWithTax;

                if (taxInclusive) {
                    subTotalJE = (baseTotal / taxMultiplier).setScale(2);
                    taxAmountJE = (baseTotal - subTotalJE).setScale(2);
                    totalWithTax = baseTotal;
                } else {
                    subTotalJE = baseTotal;
                    taxAmountJE = (baseTotal * taxValue / 100).setScale(2);
                    totalWithTax = (subTotalJE + taxAmountJE).setScale(2);
                }

                System.debug('🟧 JE Calculations → Sub=' + subTotalJE + ' Tax=' + taxAmountJE + ' Total=' + totalWithTax);

                Xero_Invoice_Entries__c journalRecord = new Xero_Invoice_Entries__c();
                journalRecord.Tax_Amount__c = taxAmountJE;
                journalRecord.Total_Amount__c = subTotalJE;
                journalRecord.Sub_Total__c = totalWithTax;
                journalRecord.Description__c = String.valueOf(entry.get('Description__c'));
                journalRecord.Tax_Inclusive__c = taxInclusive;
                journalRecord.Sl_no__c = Decimal.valueOf(String.valueOf(entry.get('sno')));
                journalRecord.Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDate'));
                journalRecord.Unit_Price__c = unitPrice;
                journalRecord.Quantity__c = quantity;
                journalRecord.Tax__c = taxValue;
                journalRecord.Xero_or_Myob_Invoice__c = invoiceRecord.Id;

                String journalId = String.valueOf(entry.get('Id'));
                Boolean validJournalId = !String.isBlank(journalId) && (journalId.length()==15 || journalId.length()==18);

                if (validJournalId) {
                    journalRecord.Id = journalId;
                    journalEntriesToUpdate.add(journalRecord);
                    System.debug('🟩 Updating JE: ' + journalId);
                } else {
                    journalEntriesToInsert.add(journalRecord);
                    System.debug('🟩 Inserting JE (no Id)');
                }
            }

            if (!journalEntriesToInsert.isEmpty()) {
                insert journalEntriesToInsert;
                System.debug('🟦 Inserted JEs: ' + journalEntriesToInsert.size());
            }
            if (!journalEntriesToUpdate.isEmpty()) {
                update journalEntriesToUpdate;
                System.debug('🟦 Updated JEs: ' + journalEntriesToUpdate.size());
            }

            /* ───────────────────────────────────────────────
            UPDATE SERVICES LIST
            ─────────────────────────────────────────────── */
            if (isParticipantInvoice == true) {

                String servicesList = (String) salesEntry.get('ServicesList');
                System.debug('🟦 ServicesList = ' + servicesList);

                if (!String.isBlank(servicesList)) {
                    List<String> serviceIds = servicesList.split(',');
                    System.debug('🟦 Parsed Service IDs: ' + serviceIds);

                    List<Services_and_Support_Plan__c> updatedServiceList = [
                        SELECT Id
                        FROM Services_and_Support_Plan__c
                        WHERE Id IN :serviceIds
                    ];

                    System.debug('🟩 Found Services to update: ' + updatedServiceList);

                    for (Services_and_Support_Plan__c serv : updatedServiceList) {
                        serv.Status__c = 'Invoice Generated';
                        serv.Xero_or_Myob_Invoice__c = invoiceRecord.Id;
                        System.debug('🟨 Updating Service → ' + serv.Id + ' with Invoice ' + invoiceRecord.Id);
                    }

                    if (!updatedServiceList.isEmpty()) {
                        update updatedServiceList;
                        System.debug('🟩 Updated Services: ' + updatedServiceList.size());
                    }
                }
            }

        } catch (Exception e) {
            System.debug('❌ ERROR in createUpdateXeroInvoice: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }

        System.debug('🟢 RETURNING Invoice Id: ' + invoiceRecord.Id);
        System.debug('──────────────────────────────────────────────');

        return invoiceRecord;
    }

    
     @AuraEnabled
    public static List<Xero_or_Myob_Invoice__c> getAccountingInvoiceByIdXero(String invoiceId) {
        // Initialize a list to hold the result
        List<Xero_or_Myob_Invoice__c> InvoiceData = new List<Xero_or_Myob_Invoice__c>();
        if (invoiceId != null) {
            // If selectedId is provided, fetch the company with that specific ID
            InvoiceData = [SELECT Id,Name,Invoice_No__c,Status__c ,GST__c,Total_Amount__c,Sub_Total__c,Participant__r.First_Name__c,Participant__r.Last_Name__c,Participant__r.Name__c,Xero_Entity__c,
                           Invoice_Date__c,staff__r.Name, Staff__r.Invoice_To__c,Due_Date__c,Participant__r.Facility__c ,Participant__r.Facility__r.ABN__c,
                           Participant__r.Facility__r.AddressData__c,Participant__r.Facility__r.Phone__c,Participant__r.Facility__r.Address__Street__s,
                           Participant__r.Facility__r.Address__City__s ,Participant__r.Facility__r.Address__StateCode__s,Participant__r.Facility__r.Address__PostalCode__s,Participant__r.Facility__r.Address__CountryCode__s,(select Id,
                                                                                                   Tax_Amount__c,Total_Amount__c,Sub_Total__c,Description__c,
                                                                                                   Invoice_Date__c,Invoice_No__c,Tax__c,
                                                                                                   Unit_Price__c,Quantity__c,Line_Items__c from Xero_Invoice_Entries__r where Unit_Price__c != null and Quantity__c != null  )
                           FROM Xero_or_Myob_Invoice__c 
                           WHERE Id =: invoiceId];
            System.debug('InvoiceData for companyId: ' + JSON.serialize(InvoiceData));
        }
        return InvoiceData;
    }
    /* @AuraEnabled(cacheable=true)
    public static List<Xero_or_Myob_Invoice__c> getBulkServicesHandlerForXero(List<String> PartcipantIdList, String sDate, String eDate, string orgid,string name) {
        System.debug('=====> Method getBulkServicesHandlerForXero called');
        System.debug('=====> orgid: ' + orgid);
        System.debug('=====> PartcipantIdList: ' + PartcipantIdList);
        System.debug('=====> sDate (String): ' + sDate);
        System.debug('=====> eDate (String): ' + eDate);
        System.debug('=====> name: ' + name);
        String baseQuery = 
            'SELECT Id, Name, Status__c, GST__c, Total_Amount__c, ' +
            ' Invoice_Date__c, Amazon_URL__c, Email_Count__c ,Xero_Entity__c,Xero_Entity__r.First_Name__c,Xero_Entity__r.Last_Name__c,' +
            'Participant__r.Facility__c, Participant__r.First_Name__c, Participant__r.Last_Name__c, Participant__r.Name__c ' +
            
            'FROM Xero_or_Myob_Invoice__c ' +
            'WHERE Is_Service_Invoice__c = true ' +
            'AND Participant__r.Facility__r.Organisation__c = :orgid';

        
        
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
        
        List<Xero_or_Myob_Invoice__c> results = Database.query(baseQuery);
        System.debug('=====> Number of records fetched: ' + results.size());
        
        return results;
    }*/
     @AuraEnabled
    public static String getentityEmailForXeroInvoices(String invoiceId) {
        String email;
        System.debug('🔍 Input Invoice ID: ' + invoiceId);
    
        if (invoiceId != null) {
            List<Xero_or_Myob_Invoice__c> invoices = [
               SELECT Id, Xero_Entity__c,Xero_Entity__r.Email__c 
                   FROM Xero_or_Myob_Invoice__c WHERE Id = :invoiceId
               
            ];
    
            System.debug('📄 Invoice Query Result: ' + JSON.serialize(invoices));
    
            if (!invoices.isEmpty()) {
                    email = invoices[0].Xero_Entity__r.Email__c;
                    System.debug('✅ Extracted Email: ' + email);
                
            } else {
                System.debug('⚠️ No entry found with the provided ID.');
            }
        } else {
            System.debug('❌ Invoice ID is null.');
        }
    
        return email;
    }
/*      @AuraEnabled(cacheable=true)
    public static List<SObject> getBulkServicesHandler(List<String> PartcipantIdList, String sDate, String eDate, string orgid,string name,String planType) {
        System.debug('=====> Method getBulkServicesHandler called');
        System.debug('=====> orgid: ' + orgid);
        System.debug('=====> PartcipantIdList: ' + PartcipantIdList);
        System.debug('=====> sDate (String): ' + sDate);
        System.debug('=====> eDate (String): ' + eDate);
        System.debug('=====> name: ' + name);
        
        Id currentUserId = UserInfo.getUserId();
            User u = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId];
            System.debug('u >> ' + u);
            Organisation__c org = [
                SELECT Id, Name, Email__c, Bank__c, Account_Name__c, BSB__c, Account_Number__c ,Accounting_Services__c
                FROM Organisation__c 
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];
            System.debug('org >> ' + org);
            String accountingService = org.Accounting_Services__c;
            System.debug('📘 Accounting Service: ' + accountingService);
        
        Date startDate = !String.isBlank(sDate) ? Date.valueOf(sDate) : null;
        Date endDate = !String.isBlank(eDate) ? Date.valueOf(eDate) : null;
        
        System.debug('=====> Parsed startDate: ' + startDate);
        System.debug('=====> Parsed endDate: ' + endDate);
        
        String baseQuery = '';
        if (accountingService == 'Tesseract System') {
            
            baseQuery = 'SELECT Id, Name, Company__c, Status__c, GST__c, Total_Amount__c, ' +
            'Company__r.Company_Name__c, Invoice_Date__c, Amazon_URL__c, Is_Payroll_Sales__c,Email_Count__c ,' +
            'Participant__r.Facility__c, Participant__r.First_Name__c, Participant__r.Last_Name__c, Participant__r.Name__c, Participant__r.address__Street__s, Participant__r.address__City__s, Participant__r.address__StateCode__s, Participant__r.Address__CountryCode__s, Participant__r.Address__PostalCode__s, Participant__r.NDIS_Participant_ID__c, ' +
            '(SELECT Id,Entity_Profile_Name__c,Accounting_Ledger_Items__c,Accounting_Ledger_Items__r.Name, Name FROM Accounting_Journal_Entry__r Where Entity_Profile_Name__c != Null LIMIT 1) ' +
            'FROM Accounting_Invoices_Expenses__c ' +
            'WHERE Is_Service_Invoice__c = true ' +
            'AND Company__r.Organization__c = :orgid';
		} else if (accountingService == 'Xero' || accountingService == 'MYOB') {
            baseQuery = 'SELECT Id, Name, Status__c, GST__c, Total_Amount__c, Invoice_Date__c, Amazon_URL__c, Email_Count__c, ' +
                'Xero_Entity__c, Xero_Entity__r.First_Name__c, Xero_Entity__r.Last_Name__c,Xero_Innvoice_Id__c, ' +
                'Participant__r.Facility__c, Participant__r.First_Name__c, Participant__r.Last_Name__c, Participant__r.Name__c, Participant__r.address__Street__s, Participant__r.address__City__s, Participant__r.address__StateCode__s, Participant__r.Address__CountryCode__s, Participant__r.Address__PostalCode__s, Participant__r.NDIS_Participant_ID__c, ' +
                'FROM Xero_or_Myob_Invoice__c ' +
                'WHERE Is_Service_Invoice__c = true ' +
                'AND Participant__r.Facility__r.Organisation__c = :orgid';
        }
        
        
        if (PartcipantIdList != null && !PartcipantIdList.isEmpty()) {
            System.debug('=====> Adding Participant__c filter to query');
            baseQuery += ' AND Participant__c IN :PartcipantIdList';
        }
      
        if (startDate != null && endDate != null) {
            System.debug('=====> Adding date range filter to query');
            baseQuery += ' AND Invoice_Date__c >= :startDate AND Invoice_Date__c <= :endDate';
        } 
        if(name !=null && name.trim() != '' ){           
            baseQuery  += ' AND Participant__r.Name__c LIKE \'%' + name + '%\'';
        }
        if(planType != null && planType != ''){
    baseQuery += ' AND Participant__r.Funds_Tracker__r.Plan_Type__c = :planType';
        }// manendra added filter for plan type in funds tracker related list on participant object

        baseQuery += ' ORDER BY CreatedDate DESC';
        
        System.debug('=====> Final SOQL query: ' + baseQuery);
        
       // List<Accounting_Invoices_Expenses__c> results = Database.query(baseQuery);
       // System.debug('=====> Number of records fetched: ' + results.size());
        
        //return results;
        return Database.query(baseQuery);
    } */
    @AuraEnabled(cacheable=true)
public static List<SObject> getBulkServicesHandler(List<String> PartcipantIdList, String sDate, String eDate, string orgid,string name,String planType) {
    System.debug('=====> Method getBulkServicesHandler called');
    System.debug('=====> orgid: ' + orgid);
    System.debug('=====> PartcipantIdList: ' + PartcipantIdList);
    System.debug('=====> sDate (String): ' + sDate);
    System.debug('=====> eDate (String): ' + eDate);
    System.debug('=====> name: ' + name);

    Id currentUserId = UserInfo.getUserId();
    User u = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId];

    Organisation__c org = [
        SELECT Id, Name, Email__c, Bank__c, Account_Name__c, BSB__c, Account_Number__c ,Accounting_Services__c
        FROM Organisation__c 
        WHERE Name = :u.Organization_Name__c
        LIMIT 1
    ];

    String accountingService = org.Accounting_Services__c;

    Date startDate = !String.isBlank(sDate) ? Date.valueOf(sDate) : null;
    Date endDate = !String.isBlank(eDate) ? Date.valueOf(eDate) : null;

    String baseQuery = '';

    if (accountingService == 'Tesseract System') {

        baseQuery = 'SELECT Id, Name, Company__c, Status__c, GST__c, Total_Amount__c, ' +
        'Company__r.Company_Name__c, Invoice_Date__c, Amazon_URL__c, Is_Payroll_Sales__c,Email_Count__c ,' +
        'Participant__r.Facility__c, Participant__r.First_Name__c, Participant__r.Last_Name__c, Participant__r.Name__c, ' +
        'Participant__r.address__Street__s, Participant__r.address__City__s, Participant__r.address__StateCode__s, ' +
        'Participant__r.Address__CountryCode__s, Participant__r.Address__PostalCode__s, Participant__r.NDIS_Participant_ID__c, ' +
        'Services_Id_List__c, ' +
        '(SELECT Id,Entity_Profile_Name__c,Accounting_Ledger_Items__c,Accounting_Ledger_Items__r.Name, Name FROM Accounting_Journal_Entry__r Where Entity_Profile_Name__c != Null LIMIT 1) ' +
        'FROM Accounting_Invoices_Expenses__c ' +
        'WHERE Is_Service_Invoice__c = true ' +
        'AND Company__r.Organization__c = :orgid';

    } else if (accountingService == 'Xero' || accountingService == 'MYOB') {

        baseQuery = 'SELECT Id, Name, Status__c, GST__c, Total_Amount__c, Invoice_Date__c, Amazon_URL__c, Email_Count__c, ' +
        'Xero_Entity__c, Xero_Entity__r.First_Name__c, Xero_Entity__r.Last_Name__c,Xero_Innvoice_Id__c, ' +
        'Participant__r.Facility__c, Participant__r.First_Name__c, Participant__r.Last_Name__c, Participant__r.Name__c, ' +
        'Participant__r.address__Street__s, Participant__r.address__City__s, Participant__r.address__StateCode__s, ' +
        'Participant__r.Address__CountryCode__s, Participant__r.Address__PostalCode__s, Participant__r.NDIS_Participant_ID__c, ' +
        'Services_Id_List__c ' +
        'FROM Xero_or_Myob_Invoice__c ' +
        'WHERE Is_Service_Invoice__c = true ' +
        'AND Participant__r.Facility__r.Organisation__c = :orgid';
    }

    if (PartcipantIdList != null && !PartcipantIdList.isEmpty()) {
        baseQuery += ' AND Participant__c IN :PartcipantIdList';
    }

    if (startDate != null && endDate != null) {
        baseQuery += ' AND Invoice_Date__c >= :startDate AND Invoice_Date__c <= :endDate';
    }

    /* if(name != null && name.trim() != '' ){           
        baseQuery  += ' AND Participant__r.Name__c LIKE \'%' + name + '%\'';
    } */

    baseQuery += ' ORDER BY CreatedDate DESC';

    System.debug('=====> Final SOQL query: ' + baseQuery);

    List<SObject> invoices = Database.query(baseQuery);

    // ---------------------------
    // Plan Type Filter (SAFE)
    // ---------------------------

    if(String.isNotBlank(planType)){

        Set<Id> serviceIds = new Set<Id>();

        for(SObject inv : invoices){

            String serviceList = (String)inv.get('Services_Id_List__c');

            if(serviceList != null){

               for(String sid : serviceList.split(',')){
    sid = sid.trim();

    if(String.isNotBlank(sid) && sid.length() == 18){
        try{
            serviceIds.add((Id)sid);
        }catch(Exception e){
            // skip invalid ids like manual_xxx
        }
    }
}
            }
        }

        Map<Id,Services_and_Support_Plan__c> serviceMap =
        new Map<Id,Services_and_Support_Plan__c>(
            [SELECT Id, Funds_Tracker__r.Plan_Type__c
             FROM Services_and_Support_Plan__c
             WHERE Id IN :serviceIds]
        );

List<SObject> filteredInvoices = new List<SObject>();

for(SObject inv : invoices){

    String serviceList = (String)inv.get('Services_Id_List__c');

    if(serviceList == null) continue;

    Boolean allMatch = true;
    Boolean hasValidService = false;

    for(String sid : serviceList.split(',')){

        sid = sid.trim();

        // Skip invalid/manual IDs
        if(String.isBlank(sid) || sid.length() != 18){
            continue;
        }

        try{
            Id serviceId = (Id)sid;

            if(serviceMap.containsKey(serviceId)){

                hasValidService = true;

                Services_and_Support_Plan__c svc = serviceMap.get(serviceId);

                if(svc.Funds_Tracker__r.Plan_Type__c != planType){
                    allMatch = false;
                    break;
                }
            }

        }catch(Exception e){
            System.debug('⚠️ Skipping invalid service ID: ' + sid);
        }
    }

    // Add invoice ONLY if all services match selected plan type
    if(allMatch && hasValidService){
        filteredInvoices.add(inv);
    }
}

        return filteredInvoices;
    }

    return invoices;
}
     @AuraEnabled(cacheable=true)
        public static Map<Id, List<Id>> getParticipantFacilityMap(List<string> participantIds) {
            Map<Id, Set<Id>> tempMap = new Map<Id, Set<Id>>();

            for (Participant_Facility__c pf : [
                SELECT Participant__c, Facility__c
                FROM Participant_Facility__c
                WHERE Participant__c IN :participantIds
                AND Active__c = true
            ]) {
                if (!tempMap.containsKey(pf.Participant__c)) {
                    tempMap.put(pf.Participant__c, new Set<Id>());
                }
                tempMap.get(pf.Participant__c).add(pf.Facility__c);
            }

            // Convert Set → List for Aura/LWC serialization
            Map<Id, List<Id>> result = new Map<Id, List<Id>>();
            for (Id pid : tempMap.keySet()) {
                result.put(pid, new List<Id>(tempMap.get(pid)));
            }
            System.debug('result ==>'+result);
            return result;
}

    public class BulkEmailResult {
   @AuraEnabled public Integer successCount;
  @AuraEnabled public Integer failureCount;
	}
    
/* @AuraEnabled
public static BulkEmailResult sendBulkServiceInvoiceEmails(List<Id> invoiceIds) {
    BulkEmailResult result = new BulkEmailResult();

    if (invoiceIds == null || invoiceIds.isEmpty()) {
        result.successCount = 0;
        result.failureCount = 0;
        return result;
    }

    System.enqueueJob(new BulkInvoiceEmailQueueable(invoiceIds));

    result.successCount = invoiceIds.size(); // accepted for async kickoff
    result.failureCount = 0;
    return result;
} */
/*@AuraEnabled
public static BulkEmailResult sendBulkServiceInvoiceEmails(List<Id> invoiceIds) {
    BulkEmailResult result = new BulkEmailResult();
    result.successCount = 0;
    result.failureCount = 0;

    if (invoiceIds == null || invoiceIds.isEmpty()) {
        return result;
    }

    for (Id invoiceId : invoiceIds) {
        try {
            System.debug('📩 Processing invoice: ' + invoiceId);

            // 1️⃣ Get entity email
            Map<String, String> emailMap =
                AccountingChartController.getentityEmailForInvoices(invoiceId);

            String toAddress = emailMap.get('to');
            String ccAddress = emailMap.get('cc');

            System.debug('📧 TO: ' + toAddress);
            System.debug('📨 CC: ' + ccAddress);

            if (String.isBlank(toAddress)) {
                result.failureCount++;
                continue;
            }

            // 2️⃣ Get subject & body
            Map<String, String> emailBodyMap =
                RosterInvoicesHandler.getEmailBodyServiceInvoice(invoiceId);

            // 3️⃣ Get PDF URL
            Accounting_Invoices_Expenses__c inv = [
                SELECT Amazon_URL__c
                FROM Accounting_Invoices_Expenses__c
                WHERE Id = :invoiceId
                LIMIT 1
            ];

            // 4️⃣ Send email (SYNC)
            RosterInvoicesHandler.sendEmailforServiceInvoice(
                invoiceId,
                toAddress,
                ccAddress,
                inv.Amazon_URL__c,
                emailBodyMap.get('subject'),
                emailBodyMap.get('body')
            );

            result.successCount++;

        } catch (Exception e) {
            result.failureCount++;
            System.debug(
                '❌ Bulk email failed for invoice ' +
                invoiceId + ': ' + e.getMessage()
            );
        }
    }

    return result;
} */
    
     @AuraEnabled
    public static BulkEmailResult sendBulkServiceInvoiceEmails(List<Id> invoiceIds) {
    
        BulkEmailResult result = new BulkEmailResult();
        result.successCount = 0;
        result.failureCount = 0;
    
        System.debug('🚀 Bulk email start. Invoice count: ' + invoiceIds.size());
    
        if (invoiceIds == null || invoiceIds.isEmpty()) {
            return result;
        }
    
        // 🔹 Org-Wide Email (ONLY ADDITION)
        OrgWideEmailAddress owea = [
            SELECT Id
            FROM OrgWideEmailAddress
            WHERE Address = :System.Label.OrgWideEmailAddress
            LIMIT 1
        ];
    
        List<Messaging.SingleEmailMessage> emails =
            new List<Messaging.SingleEmailMessage>();
    
        for (Id invoiceId : invoiceIds) {
            try {
                System.debug('📩 Processing invoice: ' + invoiceId);
    
                // 1️⃣ Get TO / CC
                Map<String, String> emailMap =
                    AccountingChartController.getentityEmailForInvoices(invoiceId);
    
                String toAddress = emailMap.get('to');
                String ccAddress = emailMap.get('cc');
    
                System.debug('📧 TO: ' + toAddress);
                System.debug('📨 CC: ' + ccAddress);
    
                if (String.isBlank(toAddress)) {
                    result.failureCount++;
                    continue;
                }
    
                // 2️⃣ Subject + Body
                Map<String, String> emailBody =
                    RosterInvoicesHandler.getEmailBodyServiceInvoice(invoiceId);
    
                // 3️⃣ Get PDF URL
                Accounting_Invoices_Expenses__c inv = [
                    SELECT Name, Amazon_URL__c
                    FROM Accounting_Invoices_Expenses__c
                    WHERE Id = :invoiceId
                    LIMIT 1
                ];
    
                // 4️⃣ Download PDF
                Http http = new Http();
                HttpRequest req = new HttpRequest();
                req.setEndpoint(inv.Amazon_URL__c);
                req.setMethod('GET');
                req.setTimeout(60000);
    
                HttpResponse res = http.send(req);
                if (res.getStatusCode() != 200) {
                    throw new CalloutException('PDF download failed');
                }
    
                Blob pdfBlob = res.getBodyAsBlob();
    
                // 5️⃣ Attachment
                Messaging.EmailFileAttachment attachment =
                    new Messaging.EmailFileAttachment();
                attachment.setFileName(inv.Name + '.pdf');
                attachment.setBody(pdfBlob);
                attachment.setContentType('application/pdf');
    
                // 6️⃣ Email
                Messaging.SingleEmailMessage email =
                    new Messaging.SingleEmailMessage();
    
                email.setToAddresses(toAddress.split('\\s*,\\s*'));
    
                if (!String.isBlank(ccAddress)) {
                    email.setCcAddresses(ccAddress.split('\\s*,\\s*'));
                }
    
                email.setSubject(emailBody.get('subject'));
                email.setHtmlBody(emailBody.get('body'));
                email.setFileAttachments(
                    new List<Messaging.EmailFileAttachment>{ attachment }
                );
    
                // 🔹 FROM = ORG-WIDE EMAIL (ONLY CHANGE)
                email.setOrgWideEmailAddressId(owea.Id);
    
                emails.add(email);
                result.successCount++;
    
                System.debug('✅ Email prepared for invoice: ' + invoiceId);
    
            } catch (Exception e) {
                result.failureCount++;
                System.debug(
                    '❌ Failed for invoice ' + invoiceId + ' | ' + e.getMessage()
                );
            }
        }
    
        // 7️⃣ Send emails
        if (!emails.isEmpty()) {
            Messaging.sendEmail(emails);
            System.debug('📤 Emails sent: ' + emails.size());
        }
    
        System.debug(
            '🏁 Bulk email finished. Success: ' +
            result.successCount + ' | Failed: ' + result.failureCount
        );
    
        return result;
    }
  
    @AuraEnabled
    public static  List<Services_and_Support_Plan__c> saveServiceSupportPlans(List<Map<String, Object>> services) {
		
        if (services == null || services.isEmpty()) {
            return new List<Services_and_Support_Plan__c>();
        }

        List<Services_and_Support_Plan__c> recordsToInsert =
            new List<Services_and_Support_Plan__c>();

        for (Map<String, Object> svc : services) {

            Services_and_Support_Plan__c service =  new Services_and_Support_Plan__c();

            service.Client__c        = (String) svc.get('Client__c');
            service.Funds_Tracker__c = (String) svc.get('Funds_Tracker__c');
            service.Service_Type__c  = (String) svc.get('Service_Type__c');
            service.Services__c      = (String) svc.get('Services__c');
            // service.State__c         = (String) svc.get('State__c');
            String rawState = (String) svc.get('State__c');
			service.State__c = normalizeStateValue(rawState);

           // service.Date_of_Service__c =Date.valueOf((String) svc.get('Date_of_Service__c'));
            if (svc.get('Date_of_Service__c') != null) {
                service.Date_of_Service__c =
                    Date.valueOf((String) svc.get('Date_of_Service__c'));
            }
            service.Qty__c               = (Decimal) svc.get('Qty__c');
            service.Edited_Unit_Price__c = (Decimal) svc.get('Edited_Unit_Price__c');
            service.Status__c            = (String) svc.get('Status__c');
            service.Manual_Service_in_Manage_Invoice__c =  (Boolean) svc.get('manual_Service__c');

           String startTimeStr = (String) svc.get('Start_Time_24_Format__c');
            String endTimeStr   = (String) svc.get('End_Time_24_Format__c');
            
            // Expecting: HH:mm:ssZ
            if (String.isNotBlank(startTimeStr)) {
                String cleanStart = startTimeStr.replace('Z', ''); // 09:00:00
                List<String> parts = cleanStart.split(':');
            
                service.Start_Time_24_Format__c = Time.newInstance(
                    Integer.valueOf(parts[0]),
                    Integer.valueOf(parts[1]),
                    Integer.valueOf(parts[2]),
                    0
                );
            }
            
            if (String.isNotBlank(endTimeStr)) {
                String cleanEnd = endTimeStr.replace('Z', ''); // 15:00:00
                List<String> parts = cleanEnd.split(':');
            
                service.End_Time_24_Format__c = Time.newInstance(
                    Integer.valueOf(parts[0]),
                    Integer.valueOf(parts[1]),
                    Integer.valueOf(parts[2]),
                    0
                );
            }

            //STAFF / CONTRACTOR
            if (svc.containsKey('Service_Users__c')) {
                service.Service_Users__c =
                    (String) svc.get('Service_Users__c');
            }

            if (svc.containsKey('Contractor_Name__c')) {
                service.Contractor_Name__c =
                    (String) svc.get('Contractor_Name__c');
            }

            recordsToInsert.add(service);
        }

        if (!recordsToInsert.isEmpty()) {
           try {
                insert recordsToInsert;
            } catch (Exception e) {
                throw new AuraHandledException(e.getMessage());
            }
        }
       // List<Services_and_Support_Plan__c> insertedServices = [SELECT Id, Client__c, Funds_Tracker__c, Status__c, Lineitem__c, Description__c,Bill_Participant__c,
              //  Qty__c,Edited_Unit_Price__c,Service_Type__c,Services__c FROM Services_and_Support_Plan__c  WHERE Id IN :recordsToInsert];
        List<Services_and_Support_Plan__c> insertedServices =  [SELECT Id, Status__c, Qty__c,Edited_Unit_Price__c,Service_Type__c, Services__c,Date_of_Service__c,
           				 Lineitem__c, Description__c,Bill_Participant__c,Client__c,Client__r.Id,Client__r.First_Name__c,Client__r.Last_Name__c,Client__r.Facility__c,
						 Funds_Tracker__c,Funds_Tracker__r.Id, Funds_Tracker__r.Entity_Profile__c FROM Services_and_Support_Plan__c WHERE Id IN :recordsToInsert];   
        return insertedServices;
    } 
    private static String normalizeStateValue(String stateApiName) {
        if (String.isBlank(stateApiName)) return null;
    
        // Convert ACT__c → ACT
        if (stateApiName.endsWith('__c')) {
            return stateApiName.replace('__c', '');
        }
    
        return stateApiName;
    }
    //manendra start
    @AuraEnabled
public static List<String> getPlanTypeOptions() {

    List<String> options = new List<String>();

    Schema.DescribeFieldResult fieldResult = 
        Funds_Tracker__c.Plan_Type__c.getDescribe();

    for (Schema.PicklistEntry entry : fieldResult.getPicklistValues()) {
        if(entry.isActive()){
            options.add(entry.getLabel());
        }
    }

    return options;
}

@AuraEnabled
public static String exportInvoicesCSV(List<Id> invoiceIds){

    List<Accounting_Invoices_Expenses__c> invoices =
        [
            SELECT Id, Name,
        Participant__r.Name__c,
        Participant__r.NDIS_Participant_ID__c,
        Participant__r.Facility__r.Organisation__r.NDIS_Provider__c,
        Participant__r.Facility__r.Organisation__r.ABN__c,
        Services_Id_List__c
    FROM Accounting_Invoices_Expenses__c
    WHERE Id IN :invoiceIds
        ];
        Set<Id> serviceIds = new Set<Id>();
        for(Accounting_Invoices_Expenses__c inv : invoices){
            if(String.isNotBlank(inv.Services_Id_List__c)){
                for(String sid : inv.Services_Id_List__c.split(',')){
                sid = sid.trim();
                    if(sid.length() == 15 || sid.length() == 18){
                    try{
                            serviceIds.add((Id)sid);
                        }catch(Exception e){}
                    }
                }
            }
        }

        Map<Id,Services_and_Support_Plan__c> serviceMap =
        new Map<Id,Services_and_Support_Plan__c>(
            [
                SELECT Id,
                    start_datetime__c,
                    end_datetime__c,
                    Lineitem__c,
                    Qty__c,
                    Unit_Price__c,
                    Edited_Unit_Price__c,
                    Amount__c
                FROM Services_and_Support_Plan__c
                WHERE Id IN :serviceIds
            ]
        );

    String csv =
    'RegistrationNumber,NDISNumber,SupportsDeliveredFrom,SupportsDeliveredTo,SupportNumber,ClaimReference,Quantity,UnitPrice,Amount,GSTCode,AuthorisedBy,ParticipantApproved,InKindFundingProgram,ClaimType,CancellationReason,ABNofSupportProvider\n';

        for(Accounting_Invoices_Expenses__c inv : invoices){
            if(String.isBlank(inv.Services_Id_List__c)) continue;
            for(String sid : inv.Services_Id_List__c.split(',')){
                sid = sid.trim();
                if(!serviceMap.containsKey((Id)sid)) continue;
                Services_and_Support_Plan__c svc = serviceMap.get((Id)sid);
                String abn = inv.Participant__r.Facility__r.Organisation__r.ABN__c;
                if(String.isBlank(abn)){
                    abn = '-';
                }

                Decimal price =
                    svc.Edited_Unit_Price__c != null
                        ? svc.Edited_Unit_Price__c
                        : (svc.Unit_Price__c != null ? svc.Unit_Price__c : 0);

                String unitPriceStr = price.setScale(2).format();

                csv +=
                /* csvSafe(inv.Name) + ',' +
                csvSafe(inv.Participant__r.Name__c) + ',' + */
                csvForceText(inv.Participant__r.Facility__r.Organisation__r.NDIS_Provider__c) + ',' +
                csvSafe(inv.Participant__r.NDIS_Participant_ID__c) + ',' +
                csvForceText(parseDateStr(svc.start_datetime__c)) + ',' +
                csvForceText(parseDateStr(svc.end_datetime__c)) + ',' +
                csvSafe(svc.Lineitem__c) + ',' +
                csvSafe('-') + ',' +               // ClaimReference
                csvSafe(String.valueOf(svc.Qty__c)) + ',' +
                csvSafe(unitPriceStr) + ',' +
                csvSafe(String.valueOf(svc.Amount__c)) + ',' +
                csvSafe('P2') + ',' +
                csvSafe('-') + ',' +               // AuthorisedBy
                csvSafe('-') + ',' +               // ParticipantApproved
                csvSafe('-') + ',' +               // InKindFundingProgram
                csvSafe('-') + ',' +               // ClaimType
                csvSafe('-') + ',' +               // CancellationReason
                csvSafe(abn) +
                '\n';
            }
        }

        return csv;
    }

    private static String csvSafe(String val){
        if(val == null) return '-';
        val = val.replace('"','""');
        return '"' + val + '"';
    }

    private static String parseDateStr(String val) {
        if (String.isBlank(val)) return '-';
        try {
            return DateTime.valueOf(val.replace('T', ' ')).format('dd/MM/yyyy');
        } catch (Exception e) {
            return '-';
        }
    }

    private static String csvForceText(String val) {
        if (String.isBlank(val)) return '-';
        val = val.replace('"', '""');
        return '="' + val + '"';
    }
//manendra end

    @AuraEnabled
    public static void updateEntity(Id recordId, String entityValue, String accountingService) {

        System.debug('RecordId: ' + recordId);
        System.debug('Entity Value: ' + entityValue);
        System.debug('Accounting Service: ' + accountingService);

        if (String.isBlank(recordId) || String.isBlank(entityValue)) {
            throw new AuraHandledException('Invalid input');
        }

        // 🔥 Tesseract System Logic
        if (accountingService == 'Tesseract System') {

            // ✅ Get all child records
            List<Accounting_Journal_Entry__c> journalEntries = [
                SELECT Id, Name, Entity_Profile__c
                FROM Accounting_Journal_Entry__c
                WHERE Accounting_Invoices_Expenses__c = :recordId
                ORDER BY Name ASC
                LIMIT 1
            ];

            System.debug('Journal Entries Found: ' + journalEntries.size());

            if (!journalEntries.isEmpty()) {

                // ✅ Update all child records
                for (Accounting_Journal_Entry__c entry : journalEntries) {
                    entry.Entity_Profile__c = entityValue;
                }

                update journalEntries;

                System.debug('✅ Updated all child records successfully');
            } else {
                System.debug('⚠️ No child records found');
            }
        } 
        else {

            List<Xero_or_Myob_Invoice__c> invoices = [
                SELECT Id, Name, Xero_Entity__c
                FROM Xero_or_Myob_Invoice__c
                WHERE Id = :recordId
                LIMIT 1
            ];

            System.debug('Invoices Found: ' + invoices.size());

            if (!invoices.isEmpty()) {

                for (Xero_or_Myob_Invoice__c inv : invoices) {
                    System.debug('Updating Invoice Id: ' + inv.Id);

                    inv.Xero_Entity__c = entityValue;
                }

                update invoices;

                System.debug('✅ Invoice updated successfully');

            } else {
                System.debug('⚠️ No invoice found for given recordId');
            }
        }
    }

    @AuraEnabled
    public static Map<String, String> checkEntityInvoice(Id invoiceId) {

        Map<String, String> result = new Map<String, String>();

        List<Xero_or_Myob_Invoice__c> invoices = [
            SELECT Id, Xero_Entity__c, Xero_Entity__r.Xero_Contact_Id__c
            FROM Xero_or_Myob_Invoice__c
            WHERE Id = :invoiceId
            LIMIT 1
        ];

        if (!invoices.isEmpty()) {
            result.put('entityId', invoices[0].Xero_Entity__c);
            result.put('contactId', invoices[0].Xero_Entity__r.Xero_Contact_Id__c);
        }

        return result;
    }
}