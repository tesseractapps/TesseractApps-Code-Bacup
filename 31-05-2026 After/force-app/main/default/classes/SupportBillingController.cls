public with sharing class SupportBillingController {
 /* public class BillingWrapper {

    @AuraEnabled public Id noteId;
    @AuraEnabled public String participantName;
    @AuraEnabled public Id participantId;
    @AuraEnabled public String serviceType;
    @AuraEnabled public Date serviceDate;
    @AuraEnabled public Decimal billableHours;
    @AuraEnabled public Decimal unitPrice;
    @AuraEnabled public Decimal amount;
    @AuraEnabled public String status;
    @AuraEnabled public String createdFrom;
    @AuraEnabled public String supportItemName;
    @AuraEnabled public String supportItemNumber;

    public BillingWrapper(
        Support_Notes__c note
    ) {
        String firstName =note.SupportClient_To_Notes__r?.First_Name__c != null
            ? note.SupportClient_To_Notes__r.First_Name__c
            : '';

    	String lastName = note.SupportClient_To_Notes__r?.Last_Name__c != null
            ? note.SupportClient_To_Notes__r.Last_Name__c
            : '';
        this.noteId = note.Id;
        this.participantId = note.SupportClient_To_Notes__c;
        //this.participantName = note.SupportClient_To_Notes__r.Name;
         this.participantName =(firstName + ' ' + lastName).trim();
        this.serviceType = note.Support_CoordinatorCatalogueGroup__r.Name;// 'Support Coordination';
        this.serviceDate = note.Entry_Date__c;
        this.billableHours = note.Duration_Hours__c != null
            ? Decimal.valueOf(note.Duration_Hours__c)
            : 0;
        this.unitPrice = note.Charge_Level__c != null
            ? Decimal.valueOf(note.Charge_Level__c)
            : 0;
        this.amount = note.Total_Cost__c != null
            ? Decimal.valueOf(note.Total_Cost__c)
            : 0;
        this.status = 'Pending';
        this.createdFrom = note.Created_From__c != null
              ?  note.Created_From__c
            : '';
        this.supportItemName = note.Support_CoordinatorCatalogue__r.Support_Item_Name__c != null
              ?  note.Support_CoordinatorCatalogue__r.Support_Item_Name__c
            : '';
        this.supportItemNumber = note.Support_CoordinatorCatalogue__r.Support_Item_Number__c != null
              ?  note.Support_CoordinatorCatalogue__r.Support_Item_Number__c
            : '';
    }
    public BillingWrapper(Support_Entry__c entry) {

        this.noteId = entry.Id;
        this.participantName = entry.SupportEntry_To_SupportClient__r.Name;
        this.serviceType = entry.ServiceType__c;
        this.serviceDate = entry.ServiceDate__c;
        this.billableHours = entry.Hours__c != null ? entry.Hours__c : 0;
        this.unitPrice = entry.Amount__c != null ? entry.Amount__c : 0;
        this.amount = entry.Total_Amount__c != null ? entry.Total_Amount__c : 0;
        this.status = entry.ClaimStatus__c;
        //this.createdFrom = entry.Created_From__c;
            
    }
}

@AuraEnabled
public static Map<String, Object> getBillingEntries(
    String participantSearch,
    Date startDate,
    Date endDate,
    Integer pageSize,
    Integer pageNumber
) {
    try {

        if (pageSize == null || pageSize <= 0) pageSize = 10;
        if (pageNumber == null || pageNumber <= 0) pageNumber = 1;

        User currentUser = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];

        if (String.isBlank(currentUser.Organization_Name__c)) {
            throw new AuraHandledException('User organisation not configured.');
        }

        String orgName = currentUser.Organization_Name__c;
        String participantFilter = '%' + participantSearch + '%';

        List<BillingWrapper> results = new List<BillingWrapper>();

String notesQuery =
    'SELECT Id,SupportClient_To_Notes__c, SupportClient_To_Notes__r.Name,SupportClient_To_Notes__r.First_Name__c,SupportClient_To_Notes__r.Last_Name__c, Entry_Date__c, ' +
    'Duration_Hours__c, Charge_Level__c, Total_Cost__c ,Created_From__c ,Support_CoordinatorCatalogue__c,Support_CoordinatorCatalogueGroup__c, ' +
    'Support_CoordinatorCatalogue__r.Support_Item_Name__c, Support_CoordinatorCatalogue__r.Support_Item_Number__c,Support_CoordinatorCatalogueGroup__r.Name ' +
    'FROM Support_Notes__c ' +
    'WHERE Billable__c = true ' +
    'AND Status__c = \'Pending\' ' +
    'AND SupportClient_To_Notes__c IN ( ' +
        'SELECT Support_Client__c ' +
        'FROM Support_CoordinatorCatalogueGroup__c ' +
        'WHERE Organization__r.Name = :orgName ' +
    ') ';

        if (!String.isBlank(participantSearch)) {
            notesQuery += 'AND SupportClient_To_Notes__r.Name LIKE :participantFilter ';
        }
        if (startDate != null) {
            notesQuery += 'AND Entry_Date__c >= :startDate ';
        }
        if (endDate != null) {
            notesQuery += 'AND Entry_Date__c <= :endDate ';
        }

        List<Support_Notes__c> notes = Database.query(notesQuery);

        for (Support_Notes__c note : notes) {
            results.add(new BillingWrapper(note));
        }

       
        results.sort(new BillingDateComparator());
        Decimal totalAmount = 0;
        for (BillingWrapper bw : results) {
            if (bw.amount != null) {
                totalAmount += bw.amount;
            }
        }

        // ================= PAGINATION ================= 
        Integer totalRecords = results.size();
        Integer totalPages = (Integer)Math.ceil((Decimal)totalRecords / pageSize);

        Integer startIndex = (pageNumber - 1) * pageSize;
        Integer endIndex = Math.min(startIndex + pageSize, totalRecords);

        List<BillingWrapper> pagedResults = new List<BillingWrapper>();

        if (startIndex < totalRecords) {
            for (Integer i = startIndex; i < endIndex; i++) {
                pagedResults.add(results[i]);
            }
        }

        Map<String, Object> response = new Map<String, Object>();
        response.put('records', pagedResults);
        response.put('totalRecords', totalRecords);
        response.put('totalPages', totalPages);
        response.put('status', 'SUCCESS');
        response.put('totalAmount', totalAmount);
        return response;

    } catch (Exception e) {
        throw new AuraHandledException(
            'Failed to load billing entries: ' + e.getMessage()
            );
        }
    }
    public class BillingDateComparator implements Comparator<BillingWrapper> {
    public Integer compare(BillingWrapper a, BillingWrapper b) {
        if (a.serviceDate == b.serviceDate) return 0;
        if (a.serviceDate == null) return 1;
        if (b.serviceDate == null) return -1;
        return b.serviceDate.daysBetween(a.serviceDate);
    }
}

    @AuraEnabled
    public static Support_Invoice__c generateInvoices(
        String salesEntryJson,
        String salesEntryListJson
    ) {
    
        if(String.isBlank(salesEntryJson)){
            throw new AuraHandledException(
                'Sales Entry data is missing.'
            );
        }
    
        // ================= DESERIALIZE =================
    
        Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
        List<Object> salesEntryList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);
     
        System.debug( 'salesEntry => ' +JSON.serializePretty(salesEntry) );
        System.debug( 'salesEntryList => ' + JSON.serializePretty(salesEntryList) );
    
        // ================= CREATE INVOICE =================
    
        Support_Invoice__c invoice = new Support_Invoice__c();
    
        invoice.SupportInvoice_To_SupportClient__c =  (String)salesEntry.get('participantId');
        invoice.DateGenerated__c =
            Date.valueOf(
                String.valueOf(
                    salesEntry.get('entryDate')
                )
            );
        invoice.Status__c =(String)salesEntry.get('status');
        invoice.SupportNotes_Id_List__c =(String)salesEntry.get('servicesList');
        invoice.Amount__c = Decimal.valueOf(
                                String.valueOf(
                                    salesEntry.get('totalAmount')
                                )
                            );
        invoice.Type__c = 'Service';
    
        insert invoice;
        System.debug('Inserted Invoice => ' +invoice.Id );
    
        // ================= CREATE CHILD ITEMS =================
    
        List<Support_InvoiceItem__c> lineItems =new List<Support_InvoiceItem__c>();
    
        for(Object obj : salesEntryList){
            Map<String, Object> row = (Map<String, Object>)obj;
    
            Support_InvoiceItem__c line =new Support_InvoiceItem__c();
            line.Support_InvoiceItem_To_Support_Invoice__c =invoice.Id;
            //line.Support_Notes__c = (String)row.get('noteId');
            line.Service_Type__c =(String)row.get('serviceType');
            line.Service_Type_Name__c = (String)row.get('supportItemName');
            line.Support_Item_Number__c = (String)row.get('supportItemNumber');
            line.BillableHours__c =row.get('hours') != null 
                					? Decimal.valueOf( String.valueOf(row.get('hours') ))
                					: 0;
            line.UnitPrice__c = row.get('unitPrice') != null
                                    ? Decimal.valueOf( String.valueOf(row.get('unitPrice')))
                                    : 0;
    
            line.Amount__c = row.get('amount') != null
                                ? Decimal.valueOf( String.valueOf(row.get('amount')))
                                : 0;
            lineItems.add(line);
        }
    
        if(!lineItems.isEmpty()){
            insert lineItems;
            System.debug( 'Inserted Line Items => ' + lineItems.size());
        }
    
        // ================= UPDATE NOTES STATUS =================
    
        String servicesList =(String)salesEntry.get('servicesList');
    
        if(!String.isBlank(servicesList)){
            List<Id> noteIds = new List<Id>();
    
            for(String idStr : servicesList.split(',')){
                if(!String.isBlank(idStr)){
                    noteIds.add((Id)idStr.trim());
                }
            }
    
            if(!noteIds.isEmpty()){
    
                List<Support_Notes__c> notesToUpdate =  new List<Support_Notes__c>();
    			List<Support_Notes__c> notesList =  [
    
                                            SELECT Id, Status__c
                                            FROM Support_Notes__c
                                            WHERE Id IN :noteIds
                            
                                        ];
                for(Support_Notes__c note : notesList){
                    note.Status__c = 'Generated';
                    notesToUpdate.add(note);
                }
    
                if(!notesToUpdate.isEmpty()){
                    update notesToUpdate;
                    System.debug('Updated Notes => ' + notesToUpdate.size());
                }
            }
        }
    
        // ================= RETURN INVOICE =================
    
        Support_Invoice__c invoiceResult = [
            SELECT Id,
                   Name,
                   SupportInvoice_To_SupportClient__c,
                   SupportInvoice_To_SupportClient__r.First_Name__c,
            	   SupportInvoice_To_SupportClient__r.Last_Name__c,
                   DateGenerated__c,
                   Amount__c,
                   Status__c,
                   Type__c,Tax_Amount__c,
                   SupportNotes_Id_List__c,
            		(SELECT Id,
                        Name,Amount__c,BillableHours__c,Service_Type__c,Service_Type_Name__c,Support_Item_Number__c,Support_InvoiceItem_To_Support_Invoice__c,UnitPrice__c
                    FROM Support_InvoiceItems__r)
            FROM Support_Invoice__c
            WHERE Id = :invoice.Id
            LIMIT 1
        ];
        
        return invoiceResult;
    }
    
    @AuraEnabled
    public static Map<String, Object> getInvoices(
        Integer pageSize,
        Integer pageNumber
    ) {
    
        if (pageSize == null || pageSize <= 0) pageSize = 5;
        if (pageNumber == null || pageNumber <= 0) pageNumber = 1;
    
        List<Support_Invoice__c> allInvoices = [
            SELECT Id,
                   Name,
                   SupportInvoice_To_SupportClient__c,
                   SupportInvoice_To_SupportClient__r.First_Name__c,
            	   SupportInvoice_To_SupportClient__r.Last_Name__c,
                   DateGenerated__c,
                   Amount__c,
                   Status__c,
                   Type__c,Tax_Amount__c,AWS_URL__c,
                   SupportNotes_Id_List__c,
            		(SELECT Id,
                        Name,Amount__c,BillableHours__c,Service_Type__c,Service_Type_Name__c,Support_Item_Number__c,Support_InvoiceItem_To_Support_Invoice__c,UnitPrice__c
                    FROM Support_InvoiceItems__r)
            FROM Support_Invoice__c
            WHERE Status__c = 'Generated'
            ORDER BY CreatedDate DESC
        ];
    
        Integer totalRecords = allInvoices.size();
        Integer totalPages = (Integer)Math.ceil((Decimal)totalRecords / pageSize);
    
        Integer startIndex = (pageNumber - 1) * pageSize;
        Integer endIndex = Math.min(startIndex + pageSize, totalRecords);
    
        List<Support_Invoice__c> paged = new List<Support_Invoice__c>();
    
        if (startIndex < totalRecords) {
            for (Integer i = startIndex; i < endIndex; i++) {
                paged.add(allInvoices[i]);
            }
        }
    
        Map<String, Object> response = new Map<String, Object>();
        response.put('records', paged);
        response.put('totalRecords', totalRecords);
        response.put('totalPages', totalPages);
    
        return response;
    }*/
    
    @AuraEnabled(cacheable=true)
    public static List<Support_Notes__c> serviceSupportList(
        List<String> clientIds, 
        String startDateStr, 
        String endDateStr, 
        String orgid, 
        Integer cacheBuster
    ) {
    
        String truncatedStr = String.valueOf(orgid).substring(0, 15);
    
        User currentUser = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            LIMIT 1
        ];
    
        if (String.isBlank(currentUser.Organization_Name__c)) {
            throw new AuraHandledException('User organisation not configured.');
        }
    
        String orgName = currentUser.Organization_Name__c;
    
        // Base query
        String query = 'SELECT Id, SupportClient_To_Notes__c, ' +
                       'SupportClient_To_Notes__r.Name, ' +
                       'SupportClient_To_Notes__r.First_Name__c, ' +
                       'SupportClient_To_Notes__r.Last_Name__c, ' +
                       'Entry_Date__c, Duration_Hours__c, Charge_Level__c, ' +
                       'Total_Cost__c, Created_From__c,Billable__c, ' +
                       'Support_CoordinatorCatalogue__c, Support_CoordinatorCatalogueGroup__c, ' +
                       'Support_CoordinatorCatalogue__r.Support_Item_Name__c, ' +
                       'Support_CoordinatorCatalogue__r.Support_Item_Number__c, ' +
                       'Support_CoordinatorCatalogueGroup__r.Name ' +
                       'FROM Support_Notes__c ' +
                       'WHERE Billable__c = true ' +
                       'AND Status__c = \'Pending\' ' +
                       'AND SupportClient_To_Notes__c IN ( ' +
                           'SELECT Support_Client__c ' +
                           'FROM Support_CoordinatorCatalogueGroup__c ' +
                           'WHERE Organization__r.Name = :orgName ' +
                       ') ' +
                       'AND SupportClient_To_Notes__r.Organization__c = :orgid ';
    
        List<String> conditions = new List<String>();
    
        Date startDate = !String.isBlank(startDateStr) ? Date.valueOf(startDateStr) : null;
        Date endDate = !String.isBlank(endDateStr) ? Date.valueOf(endDateStr) : null;
    
        if(clientIds != null && !clientIds.isEmpty()) {
            conditions.add('SupportClient_To_Notes__c IN :clientIds');
        }
    
        if(startDate != null && endDate != null) {
            conditions.add('Entry_Date__c >= :startDate AND Entry_Date__c <= :endDate');
        }
    
        if(!conditions.isEmpty()) {
            query += ' AND ' + String.join(conditions, ' AND ');
        }
    
        query += ' ORDER BY Entry_Date__c DESC';
    
        System.debug('=====> Final Query: ' + query);
    
        List<Support_Notes__c> results = Database.query(query);
    
        System.debug('=====> Records fetched: ' + results.size());
    
        return results;
    }
    
      @AuraEnabled(cacheable=true)
public static List<SObject> getBulkServicesHandler(List<String> PartcipantIdList, String sDate, String eDate, string orgid) {
    System.debug('=====> Method getBulkServicesHandler called');
    System.debug('=====> orgid: ' + orgid);
    System.debug('=====> PartcipantIdList: ' + PartcipantIdList);
    System.debug('=====> sDate (String): ' + sDate);
    System.debug('=====> eDate (String): ' + eDate);
   // System.debug('=====> name: ' + name);

    Id currentUserId = UserInfo.getUserId();
    User u = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId];

    Organisation__c org = [
        SELECT Id, Name, Email__c, Bank__c, Account_Name__c, BSB__c, Account_Number__c ,Accounting_Services__c
        FROM Organisation__c 
        WHERE Name = :u.Organization_Name__c
        LIMIT 1
    ];

    //String accountingService = org.Accounting_Services__c;

    Date startDate = !String.isBlank(sDate) ? Date.valueOf(sDate) : null;
    Date endDate = !String.isBlank(eDate) ? Date.valueOf(eDate) : null;

    String baseQuery = '';


        baseQuery = 'SELECT Id, Name,  SupportInvoice_To_SupportClient__c, SupportInvoice_To_SupportClient__r.First_Name__c,  ' +
        'SupportInvoice_To_SupportClient__r.Last_Name__c, DateGenerated__c,Amount__c, Status__c ,' +
        'Type__c,Tax_Amount__c,AWS_URL__c, SupportNotes_Id_List__c, ' +
        '(SELECT Id,Name,Amount__c,BillableHours__c,Service_Type__c,Service_Type_Name__c,Support_Item_Number__c,Support_InvoiceItem_To_Support_Invoice__c,UnitPrice__c FROM Support_InvoiceItems__r) ' +
        'FROM Support_Invoice__c ' +
        //'WHERE Status__c = \'Generated\' ' +
        'WHERE SupportInvoice_To_SupportClient__r.Organization__c = :orgid ';


    if (PartcipantIdList != null && !PartcipantIdList.isEmpty()) {
        baseQuery += ' AND SupportInvoice_To_SupportClient__c IN :PartcipantIdList';
    }

    if (startDate != null && endDate != null) {
        baseQuery += ' AND DateGenerated__c >= :startDate AND DateGenerated__c <= :endDate';
    }

    /* if(name != null && name.trim() != '' ){           
        baseQuery  += ' AND Participant__r.Name__c LIKE \'%' + name + '%\'';
    } */

    baseQuery += ' ORDER BY CreatedDate DESC';

    System.debug('=====> Final SOQL query: ' + baseQuery);

    List<SObject> invoices = Database.query(baseQuery);

    
                return invoices;
            }
    
     @AuraEnabled
    public static Id generateInvoices(
        String salesEntryJson,
        String salesEntryListJson
    ) {
    
        if(String.isBlank(salesEntryJson)){
            throw new AuraHandledException(
                'Sales Entry data is missing.'
            );
        }
    
        // ================= DESERIALIZE =================
    
        Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
        List<Object> salesEntryList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);
     
        System.debug( 'salesEntry => ' +JSON.serializePretty(salesEntry) );
        System.debug( 'salesEntryList => ' + JSON.serializePretty(salesEntryList) );
    
        // ================= CREATE INVOICE =================
    
        Support_Invoice__c invoice = new Support_Invoice__c();
    
        invoice.SupportInvoice_To_SupportClient__c =  (String)salesEntry.get('participantId');
        invoice.DateGenerated__c =
            Date.valueOf(
                String.valueOf(
                    salesEntry.get('entryDate')
                )
            );
        invoice.Status__c =(String)salesEntry.get('status');
        invoice.SupportNotes_Id_List__c =(String)salesEntry.get('servicesList');
        invoice.Amount__c = Decimal.valueOf(
                                String.valueOf(
                                    salesEntry.get('totalAmount')
                                )
                            );
        invoice.Type__c = 'Service';
    
        insert invoice;
        System.debug('Inserted Invoice => ' +invoice.Id );
    
        // ================= CREATE CHILD ITEMS =================
    
        List<Support_InvoiceItem__c> lineItems =new List<Support_InvoiceItem__c>();
    
        for(Object obj : salesEntryList){
            Map<String, Object> row = (Map<String, Object>)obj;
    
            Support_InvoiceItem__c line =new Support_InvoiceItem__c();
            line.Support_InvoiceItem_To_Support_Invoice__c =invoice.Id;
            //line.Support_Notes__c = (String)row.get('noteId');
            line.Service_Type__c =(String)row.get('serviceType');
            line.Service_Type_Name__c = (String)row.get('supportItemName');
            line.Support_Item_Number__c = (String)row.get('supportItemNumber');
            line.BillableHours__c =row.get('hours') != null 
                					? Decimal.valueOf( String.valueOf(row.get('hours') ))
                					: 0;
            line.UnitPrice__c = row.get('unitPrice') != null
                                    ? Decimal.valueOf( String.valueOf(row.get('unitPrice')))
                                    : 0;
    
            line.Amount__c = row.get('amount') != null
                                ? Decimal.valueOf( String.valueOf(row.get('amount')))
                                : 0;
            lineItems.add(line);
        }
    
        if(!lineItems.isEmpty()){
            insert lineItems;
            System.debug( 'Inserted Line Items => ' + lineItems.size());
        }
    
        // ================= UPDATE NOTES STATUS =================
    
        String servicesList =(String)salesEntry.get('servicesList');
    
        if(!String.isBlank(servicesList)){
            List<Id> noteIds = new List<Id>();
    
            for(String idStr : servicesList.split(',')){
                if(!String.isBlank(idStr)){
                    noteIds.add((Id)idStr.trim());
                }
            }
    
            if(!noteIds.isEmpty()){
    
                List<Support_Notes__c> notesToUpdate =  new List<Support_Notes__c>();
    			List<Support_Notes__c> notesList =  [
    
                                            SELECT Id, Status__c
                                            FROM Support_Notes__c
                                            WHERE Id IN :noteIds
                            
                                        ];
                for(Support_Notes__c note : notesList){
                    note.Status__c = 'Generated';
                    notesToUpdate.add(note);
                }
    
                if(!notesToUpdate.isEmpty()){
                    update notesToUpdate;
                    System.debug('Updated Notes => ' + notesToUpdate.size());
                }
            }
        }
    	return invoice.Id;
        
    }
     @AuraEnabled
    public static void updateQty (Id recordId, Decimal newQty){ 
        Support_Notes__c acc = [SELECT Id, SupportClient_To_Notes__c,Duration_Hours__c, Charge_Level__c  FROM Support_Notes__c WHERE Id = :recordId LIMIT 1];
          Decimal chargeLevel = 0;

        if (String.isNotBlank(acc.Charge_Level__c)) {
            chargeLevel = Decimal.valueOf(acc.Charge_Level__c);
        }

        Decimal totalCost = newQty * chargeLevel;
        acc.Duration_Hours__c =  String.valueOf(newQty);
        acc.Total_Cost__c = String.valueOf(totalCost);
        update acc;
    }
    @AuraEnabled(cacheable=true)
    public static Support_Invoice__c getSupportInvoiceById(Id invoiceId){
    
        return [
            SELECT Id, Name, SupportInvoice_To_SupportClient__c,
                   SupportInvoice_To_SupportClient__r.First_Name__c,
                   SupportInvoice_To_SupportClient__r.Last_Name__c,
        
                   SupportInvoice_To_SupportClient__r.NDIS_Number__c,
                   SupportInvoice_To_SupportClient__r.Address__c,
             	   SupportInvoice_To_SupportClient__r.Address__Street__s,
                    SupportInvoice_To_SupportClient__r.Address__City__s,
                    SupportInvoice_To_SupportClient__r.Address__StateCode__s,
                    SupportInvoice_To_SupportClient__r.Address__PostalCode__s,
                    SupportInvoice_To_SupportClient__r.Address__CountryCode__s,
                   DateGenerated__c, Amount__c, Status__c,
        
                   Type__c, Tax_Amount__c, AWS_URL__c,
                   SupportNotes_Id_List__c,
        
                   (SELECT Id, Name, Amount__c,
                           BillableHours__c, Service_Type__c,
                           Service_Type_Name__c,
                           Support_Item_Number__c,
                           Support_InvoiceItem_To_Support_Invoice__c,
                           UnitPrice__c
                    FROM Support_InvoiceItems__r)
        
            FROM Support_Invoice__c
            WHERE Id = :invoiceId
            LIMIT 1
        ];
        
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
            //String accountingService = org.Accounting_Services__c;
           // System.debug('📘 Accounting Service: ' + accountingService);
            
           // if (accountingService == 'Tesseract System') {
                // Query the invoice record (replace Invoice__c with your actual object API name)
                Support_Invoice__c invoiceRecord = [SELECT Id, Status__c FROM Support_Invoice__c WHERE Id = :invoiceId LIMIT 1];
                
                //if (invoiceRecord != null) {
                    invoiceRecord.Status__c = 'Cancelled';  // Set status to Cancelled
                    update invoiceRecord;
                    return true;  // Success
                //}
               
            
        } catch (Exception e) {
            // Log error or add custom error handling
            throw new AuraHandledException('Error cancelling invoice: ' + e.getMessage());
        }
    }
              
        
}