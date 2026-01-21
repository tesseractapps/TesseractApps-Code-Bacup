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
    public static List<Services_and_Support_Plan__c> serviceSupportList(List<String> clientIds, String startDateStr, String endDateStr ,string orgid ,string name,list<string> status,String accountingService ) {
        System.debug('=====> name serviceSupportList : ' + name);
        String trucatedStr = string.valueof(orgid).substring(0,15);
        // Base query
        String query = 'SELECT Id, Client__c,Client__r.Name__c, Client__r.Facility__c, Client__r.First_Name__c, Client__r.Last_Name__c,Status__c,Resource_Name__c,Service_Type_Name__c,Description__c,GST__c,ShiftwithStaff__c, ' +
            'Client__r.Picture__c,Lineitem__c,Date_of_Service__c,Amount__c,Available_Fund__c,Unit_Price__c,Qty__c,Edited_Unit_Price__c,Funds_Tracker__c,Funds_Tracker__r.Entity_Profile__c,Funds_Tracker__r.Xero_Entity__c ,Funds_Tracker__r.Xero_Entity__r.Xero_Contact_Id__c FROM Services_and_Support_Plan__c WHERE Client__r.Facility__r.Organisation__c=:orgid AND Un_Assigned_Service__c=FALSE AND ';
        
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
        if (status != null && status.size() > 0) { 
            // Escape values & wrap them in quotes
            List<String> quotedStatuses = new List<String>();
            for (String s : status) {
                quotedStatuses.add('\'' + String.escapeSingleQuotes(s) + '\'');
            }
            conditions.add('Status__c IN (' + String.join(quotedStatuses, ',') + ')');
        }
        if (accountingService == 'Xero') {
            conditions.add('Funds_Tracker__r.Xero_Entity__r.Xero_Contact_Id__c != null');
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
        //return Database.query(query);
        List<Services_and_Support_Plan__c> results = Database.query(query);
        System.debug('=====> Number of records fetched: ' + results.size());
        
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
            SELECT Id, Name, Card_Type__c, Designation__c, Name__c, First_Name__c, Last_Name__c, Company__c,Company__r.Company_Name__c
            FROM Entity_Profile__c
            WHERE Company__r.Facility__c = :facilityId AND Card_Type__c = 'Customer'
        ];
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
                
                if (!AJE.Accounting_Journal_Entry__r.isEmpty()) {
                    Entity_Profile__c entity = AJE.Accounting_Journal_Entry__r[0].Entity_Profile__r;
                    
                    // Build the entity name based on available fields
                    
                    if (entity != null) {
                        if (!String.isBlank(entity.First_Name__c) || !String.isBlank(entity.Last_Name__c)) {
                            entityName = (entity.First_Name__c != null ? entity.First_Name__c + ' ' : '') +
                                (entity.Last_Name__c != null ? entity.Last_Name__c : '');
                        } else {
                            entityName = entity.Name__c;
                        }
                    }
                }
             } else if (accountingService == 'Xero') {
                 // Query Xero Invoice
                 Xero_or_Myob_Invoice__c xeroInvoice = [
                     SELECT Id, Name,Invoice_No__c, Invoice_Date__c, Total_Amount__c,Email_Count__c,
                     Xero_Entity__r.First_Name__c, Xero_Entity__r.Last_Name__c
                     FROM Xero_or_Myob_Invoice__c 
                     WHERE Id = :invoiceId
                     LIMIT 1
                 ];
                 
                invoiceNumber = xeroInvoice.Invoice_No__c;
                invoiceDate = xeroInvoice.Invoice_Date__c;
                totalAmount = xeroInvoice.Total_Amount__c!=null ?xeroInvoice.Total_Amount__c :0;
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
        
        if (String.isNotBlank(ccAddress)) {
            email.setCcAddresses(new List<String>{ ccAddress });
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
            System.debug('🔵 Step 1: Incoming Parameters');
            System.debug('➡ salesEntryJson: ' + salesEntryJson);
            System.debug('➡ salesEntryListJson: ' + salesEntryListJson);
            System.debug('➡ amountEntryJson: ' + amountEntryJson);
            
          // Step 2: Deserialize JSON
            Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
            Map<String, Object> amountEntry = (Map<String, Object>) JSON.deserializeUntyped(amountEntryJson);
            
            List<Object> rawList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);
            List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>();
            Set<Id> journalIds = new Set<Id>(); // 🆕 Collect IDs for update
            for (Object obj : rawList) {
                Map<String, Object> entryMap = (Map<String, Object>) obj;
                salesEntryList.add(entryMap);
    
                if (entryMap.containsKey('Id') && entryMap.get('Id') != null) {
                    String journalId = String.valueOf(entryMap.get('Id'));
                    if (!String.isBlank(journalId) && (journalId.length() == 15 || journalId.length() == 18)) {
                        journalIds.add(journalId);
                    }
                }
            }
            Map<Id, Xero_Invoice_Entries__c> existingJournalEntryMap = new Map<Id, Xero_Invoice_Entries__c>();
            if (!journalIds.isEmpty()) {
                existingJournalEntryMap = new Map<Id, Xero_Invoice_Entries__c>(
                    [SELECT Id, Sl_no__c FROM Xero_Invoice_Entries__c WHERE Id IN :journalIds]
                );
            }
            System.debug('✅ Deserialized salesEntry: ' + salesEntry);
            System.debug('✅ Deserialized amountEntry: ' + amountEntry);
            System.debug('✅ Deserialized salesEntryList: ' + salesEntryList);
            
            // Step 3: Build Invoice Record
            String invoiceId = String.valueOf(salesEntry.get('invoiceId'));
            Boolean isValidId = !String.isBlank(invoiceId) && (invoiceId.length() == 15 || invoiceId.length() == 18);
            System.debug('isValidId ' + isValidId);
          
            Decimal subTotal = Decimal.valueOf(String.valueOf(amountEntry.get('subTotal')));
            Decimal taxAmount = Decimal.valueOf(String.valueOf(amountEntry.get('taxAmount')));
            Decimal totalAmount = Decimal.valueOf(String.valueOf(amountEntry.get('totalAmount')));
             System.debug('✅ subTotal: ' + subTotal);
            System.debug('✅ taxAmount ' + taxAmount);
              System.debug('✅ totalAmount ' + totalAmount);
            
            
            System.debug('✅ InvoiceDate ' + Date.valueOf((String)salesEntry.get('InvoiceDate')));
            System.debug('✅ InvoiceNo ' + (String)salesEntry.get('InvoiceNo'));
            System.debug('✅ Status ' + (String)salesEntry.get('Status'));
            //System.debug('✅ company ' + (String)salesEntry.get('company'));
            
            invoiceRecord = new Xero_or_Myob_Invoice__c(
                //Include_GST__c     = (String)salesEntry.get('IncludeGST'),
                Invoice_Date__c    = Date.valueOf((String)salesEntry.get('InvoiceDate')),
         
                Invoice_No__c      = (String)salesEntry.get('InvoiceNo'),
                Status__c          = (String)salesEntry.get('Status'),
               // Company__c         = (String)salesEntry.get('company'),
               // Entity_Type__c     = 'Invoice',
                GST__c             = taxAmount,
                Total_Amount__c    = totalAmount,
                Sub_Total__c       = subTotal,
                Invoice_Source__c  ='Xero'
            );
            if(isParticipantInvoice ==true){
               invoiceRecord.Participant__c=(String)salesEntry.get('participantID');
               invoiceRecord.Is_Service_Invoice__c=true;
               invoiceRecord.Services_Id_List__c=(String)salesEntry.get('ServicesList');
            }else{ 
                  //invoiceRecord.Post_Date__c= Date.valueOf((String)salesEntry.get('PostDate'));
                  invoiceRecord.Due_Date__c = Date.valueOf((String)salesEntry.get('dueDate'));
            }
            system.debug('entityId >>>'+ (String)salesEntry.get('entityProfileId'));
            String entityId = (String)salesEntry.get('entityProfileId');
            invoiceRecord.Xero_Entity__c = entityId;
                if (entityId != null) {
                        Xero_Entity__c entity = [
                            SELECT Id, First_Name__c, Last_Name__c 
                            FROM Xero_Entity__c 
                            WHERE Id = :entityId 
                            LIMIT 1
                        ];
                        
                        /*if (entity.Name__c != null && entity.Name__c.trim() != '') {
                            invoiceRecord.Entity_Profile_Name__c = entity.Name__c;
                        } else {
                            String fullName = ((entity.First_Name__c != null) ? entity.First_Name__c : '') + 
                                ' ' + 
                                ((entity.Last_Name__c != null) ? entity.Last_Name__c : '');
                            invoiceRecord.Entity_Profile_Name__c = fullName.trim();
                        }*/
                    }
            
                System.debug('isValidId ==>' + isValidId);
            if (isValidId) {
                invoiceRecord.Id = invoiceId;
                update invoiceRecord;
                System.debug('✅ Invoice Updated: ' + invoiceRecord.Id);
            } else {
                insert invoiceRecord;
                System.debug('✅ Invoice Inserted: ' + invoiceRecord.Id);
                invoiceRecord = [
                    SELECT Id, Name, Total_Amount__c,Invoice_No__c
                    FROM Xero_or_Myob_Invoice__c
                    WHERE Id = :invoiceRecord.Id
                ];
                if (String.isBlank(invoiceRecord.Invoice_No__c)) {
                    String autoName = invoiceRecord.Name;
                    if (invoiceRecord.Total_Amount__c < 0) {
                        invoiceRecord.Invoice_No__c = autoName.replace('INV-', 'CN-');
                    } else {
                        invoiceRecord.Invoice_No__c = autoName;
                    }
    
                    update invoiceRecord; // Save custom invoice number
                    System.debug('🔄 Invoice_No__c updated: ' + invoiceRecord.Invoice_No__c);
                }
            }
            
            // Step 4: Process Journal Entries
            for (Map<String, Object> entry : salesEntryList) {
                System.debug('➡ Processing entry: ' + entry);
                //  System.debug('➡ Processing entry: ' +(String)salesEntry.get('lineItems'));
                String taxStr = String.valueOf(entry.get('tax')).replace('%', '');
                Decimal taxValue = Decimal.valueOf(taxStr);
                Decimal taxMultiplier = 1 + (taxValue / 100);
                 
                Decimal unitPrice = Decimal.valueOf(String.valueOf(entry.get('Amount__c')));
                System.debug('➡ Processing unitPrice: ' + unitPrice);
                Decimal quantity = Decimal.valueOf(String.valueOf(entry.get('Quantity__c')));
                System.debug('➡ Processing quantity: ' + quantity);
                Boolean taxInclusive = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusive')));
    			System.debug('➡ Tax Inclusive? ' + taxInclusive);
                Decimal baseTotal = (unitPrice * quantity).setScale(2);
               // Decimal totalWithTax = subTotalJE / taxMultiplier;
               // Decimal taxAmountJE = (subTotalJE - totalWithTax).setScale(2);
                
                 
                Decimal subTotalJE;
    			Decimal taxAmountJE;
    			Decimal totalWithTax;
                if (taxInclusive) {
                    // Tax is included in the amount
                    subTotalJE = (baseTotal / taxMultiplier).setScale(2);
                    taxAmountJE = (baseTotal - subTotalJE).setScale(2);
                    totalWithTax = baseTotal;
                } else {
                    // Tax is added on top
                    subTotalJE = baseTotal;
                    taxAmountJE = (baseTotal * taxValue / 100).setScale(2);
                    totalWithTax = (subTotalJE + taxAmountJE).setScale(2);
                }
                System.debug('✅ Sub Total: ' + subTotalJE);
                System.debug('✅ Tax Amount: ' + taxAmountJE);
                System.debug('✅ Total Amount: ' + totalWithTax);
                
                Xero_Invoice_Entries__c journalRecord = new Xero_Invoice_Entries__c();
                
                
                // Now assign the fields separately
                journalRecord.Tax_Amount__c = taxAmountJE;
                journalRecord.Total_Amount__c = subTotalJE;
                journalRecord.Sub_Total__c = totalWithTax;
                //journalRecord.Amount__c = totalWithTax;
                journalRecord.Description__c = String.valueOf(entry.get('Description__c'));
                //journalRecord.Company__c = (String)salesEntry.get('company');
                journalRecord.Tax_Inclusive__c = (Boolean)salesEntry.get('taxInclusive');
                //journalRecord.Entry_Type__c = 'Sales';
              
                journalRecord.Sl_no__c = Decimal.valueOf(String.valueOf(entry.get('sno')));
                journalRecord.Invoice_Date__c = Date.valueOf((String)salesEntry.get('InvoiceDate'));
                //system.debug('entityId >>>'+ (String)salesEntry.get('entityProfileId'));
               // String entityId = (String)salesEntry.get('entityProfileId');
                
                      
                 System.debug('isParticipantInvoice : ' + isParticipantInvoice);
                if(isParticipantInvoice ==false){
                   // journalRecord.Post_Date__c = Date.valueOf((String)salesEntry.get('PostDate'));                                    
                    journalRecord.Invoice_No__c = (String)salesEntry.get('InvoiceNo'); // Uncomment if needed
                    //journalRecord.Comments__c = (String)salesEntry.get('comments');
                    //journalRecord.Notes__c = (String)salesEntry.get('notes');
                }else{
                    journalRecord.Line_Items__c=String.valueOf(entry.get('lineItems'));
                }
               
                journalRecord.Unit_Price__c = unitPrice;
                journalRecord.Quantity__c = quantity;
                journalRecord.Tax__c = taxValue;
               // journalRecord.Accounting_Ledger_Items__c = String.valueOf(entry.get('accountItemId'));
                journalRecord.Xero_or_Myob_Invoice__c = invoiceRecord.Id;
                //journalRecord.Row_Unique_ID__c =String.valueOf(DateTime.now().getTime()).substring(3);

                String journalId = String.valueOf(entry.get('Id'));
                Boolean validJournalId = !String.isBlank(journalId) && (journalId.length() == 15 || journalId.length() == 18);
                 //if (isRFQ == true) {
                   // journalRecord.Is_RFQ__c = true;
                    //journalRecord.Tax_Inclusive__c = (Boolean)salesEntry.get('taxInclusive');  
                //}
                if (validJournalId) {
                    journalRecord.Id = journalId;
                    
                    Xero_Invoice_Entries__c existing = existingJournalEntryMap.get(journalId);
                   // if (existing != null && existing.Sl_no__c != null && existing.Sl_no__c != journalRecord.Sl_no__c) {
                       // journalRecord.Is_Sno_Changed__c = true; 
                       // System.debug('⚠️ SNO changed for: ' + journalId + ' (Old: ' + existing.Sl_no__c + ', New: ' + journalRecord.Sl_no__c + ')'); 
                   // }
                    journalEntriesToUpdate.add(journalRecord);
                } else {
                    journalEntriesToInsert.add(journalRecord);
                }
            }
            
            // Step 5: Perform Bulk DML
            if (!journalEntriesToInsert.isEmpty()) {
                insert journalEntriesToInsert;
                System.debug('✅ Inserted ' + journalEntriesToInsert.size() + ' Journal Entries');
            }
            
            if (!journalEntriesToUpdate.isEmpty()) {
                update journalEntriesToUpdate;
                System.debug('✅ Updated ' + journalEntriesToUpdate.size() + ' Journal Entries');
            }
            
        } catch (Exception e) {
            System.debug('❌ Exception occurred: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
        
        System.debug('🔚 Returning Invoice Record: ' + invoiceRecord);
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
     @AuraEnabled(cacheable=true)
    public static List<SObject> getBulkServicesHandler(List<String> PartcipantIdList, String sDate, String eDate, string orgid,string name) {
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
            'Participant__r.Facility__c, Participant__r.First_Name__c, Participant__r.Last_Name__c, Participant__r.Name__c, ' +
            '(SELECT Id,Entity_Profile_Name__c, Name FROM Accounting_Journal_Entry__r Where Entity_Profile_Name__c != Null LIMIT 1) ' +
            'FROM Accounting_Invoices_Expenses__c ' +
            'WHERE Is_Service_Invoice__c = true ' +
            'AND Company__r.Organization__c = :orgid';
		} else if (accountingService == 'Xero') {
            baseQuery = 'SELECT Id, Name, Status__c, GST__c, Total_Amount__c, Invoice_Date__c, Amazon_URL__c, Email_Count__c, ' +
                'Xero_Entity__c, Xero_Entity__r.First_Name__c, Xero_Entity__r.Last_Name__c,Xero_Innvoice_Id__c, ' +
                'Participant__r.Facility__c, Participant__r.First_Name__c, Participant__r.Last_Name__c, Participant__r.Name__c ' +
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
        
        baseQuery += ' ORDER BY CreatedDate DESC';
        
        System.debug('=====> Final SOQL query: ' + baseQuery);
        
       // List<Accounting_Invoices_Expenses__c> results = Database.query(baseQuery);
       // System.debug('=====> Number of records fetched: ' + results.size());
        
        //return results;
        return Database.query(baseQuery);
    }
   
}