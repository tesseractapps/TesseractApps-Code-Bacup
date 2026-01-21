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
    @AuraEnabled(cacheable=true)
    public static List<Accounting_Invoices_Expenses__c> getBulkServicesHandler(List<String> PartcipantIdList, String sDate, String eDate, string orgid,string name) {
        System.debug('=====> Method getBulkServicesHandler called');
        System.debug('=====> orgid: ' + orgid);
        System.debug('=====> PartcipantIdList: ' + PartcipantIdList);
        System.debug('=====> sDate (String): ' + sDate);
        System.debug('=====> eDate (String): ' + eDate);
        System.debug('=====> name: ' + name);
        String baseQuery = 
            'SELECT Id, Name, Company__c, Status__c, GST__c, Total_Amount__c, ' +
            'Company__r.Company_Name__c, Invoice_Date__c, Amazon_URL__c, Is_Payroll_Sales__c,Email_Count__c ,' +
            'Participant__r.Facility__c, Participant__r.First_Name__c, Participant__r.Last_Name__c, Participant__r.Name__c, ' +
            '(SELECT Id,Entity_Profile_Name__c, Name FROM Accounting_Journal_Entry__r Where Entity_Profile_Name__c != Null LIMIT 1) ' +
            'FROM Accounting_Invoices_Expenses__c ' +
            'WHERE Is_Service_Invoice__c = true ' +
            'AND Company__r.Organization__c = :orgid';

        
        
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
        System.debug('=====> name serviceSupportList : ' + name);
        String trucatedStr = string.valueof(orgid).substring(0,15);
        // Base query
        String query = 'SELECT Id, Client__c,Client__r.Name__c, Client__r.Facility__c, Client__r.First_Name__c, Client__r.Last_Name__c,Status__c,Resource_Name__c,Service_Type_Name__c,Description__c,GST__c,ShiftwithStaff__c, ' +
            'Client__r.Picture__c,Lineitem__c,Date_of_Service__c,Amount__c,Available_Fund__c,Unit_Price__c,Qty__c,Edited_Unit_Price__c,Funds_Tracker__c,Funds_Tracker__r.Entity_Profile__c,Funds_Tracker__r.Xero_Entity__c  FROM Services_and_Support_Plan__c WHERE Client__r.Facility__r.Organisation__c=:orgid AND Un_Assigned_Service__c=FALSE AND ';
        
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
            // Query the invoice record (replace Invoice__c with your actual object API name)
            Accounting_Invoices_Expenses__c invoiceRecord = [SELECT Id, Status__c FROM Accounting_Invoices_Expenses__c WHERE Id = :invoiceId LIMIT 1];
            
            if (invoiceRecord != null) {
                invoiceRecord.Status__c = 'Cancelled';  // Set status to Cancelled
                update invoiceRecord;
                return true;  // Success
            }
            return false;  // Record not found
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
            Organisation__c org = [
                SELECT Id, Name, Email__c, Bank__c, Account_Name__c, BSB__c, Account_Number__c 
                FROM Organisation__c 
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];
            System.debug('org >> ' + org);
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
            Entity_Profile__c entity;
            if (!AJE.Accounting_Journal_Entry__r.isEmpty()) {
                entity = AJE.Accounting_Journal_Entry__r[0].Entity_Profile__r;
            }
            
            // Build the entity name based on available fields
            String entityName = '';
            if (entity != null) {
                if (!String.isBlank(entity.First_Name__c) || !String.isBlank(entity.Last_Name__c)) {
                    entityName = (entity.First_Name__c != null ? entity.First_Name__c + ' ' : '') +
                                 (entity.Last_Name__c != null ? entity.Last_Name__c : '');
                } else {
                    entityName = entity.Name__c;
                }
            }
            // Format dates
            //String formattedStartDate = formatDateDDMMYYYY(invoiceStartDate);
            //String formattedEndDate = formatDateDDMMYYYY(invoiceEndDate);
            //String formattedInvoiceDate = formatDateDDMMYYYY(invoiceDate);
            System.debug('AJE >> ' + AJE);
            String formattedIssueDate = formatDateDDMMYYYY(AJE.Invoice_Date__c);
            System.debug('formattedIssueDate >> ' + formattedIssueDate);
           // Date dueDate = AJE.Invoice_Date__c != null ? AJE.Invoice_Date__c.addDays(14) : Date.today().addDays(14);
           	//Date dueDate = AJE.Due_Date__c;
           // String formattedDueDate = formatDateDDMMYYYY(dueDate);
           // String fileName = AJE.Name;
           // System.debug('formattedDueDate >> ' + formattedDueDate);    
            
            Map<String, String> result = new Map<String, String>();
   			String subject =  'Invoice ' + AJE.Name + ' is generated on ' + formattedIssueDate;
            System.debug('formattedIssueDate >> ' + formattedIssueDate);
            System.debug('entityName >> ' + entityName);
            System.debug('AJE.Name >> ' + AJE.Name);
            System.debug('org.Name >> ' + org.Name);
            System.debug('String.valueOf(AJE.Total_Amount__c.setScale(2)) >> ' + (AJE.Total_Amount__c != null ? AJE.Total_Amount__c.setScale(2) : 0));
            System.debug('org.Bank__c >> ' + org.Bank__c);
            System.debug('org.Account_Name__c >> ' + org.Account_Name__c);
            System.debug('org.BSB__c >> ' + org.BSB__c);
            System.debug('org.Account_Number__c >> ' + org.Account_Number__c);
            System.debug('formattedIssueDate >> ' + formattedIssueDate);
   			String body = 
                        'Dear <b>' + entityName + '</b>,<br/><br/>' +
                        'Please find attached the tax invoice <b>' + AJE.Name + '</b> is Generated on <b>' +  formattedIssueDate +
                         '</b>, issued by <b>' + org.Name + '</b>.<br/><br/>' +
                    
                        '<b>Invoice Summary:</b><br/>' +
                        '<b>Invoice Number:</b> ' + AJE.Name + '<br/>' +
                        '<b>Date Issued:</b> ' + formattedIssueDate + '<br/>' +
                        //'<b>Due Date:</b> ' + formattedDueDate + '<br/>' +
                        '<b>Total Amount:</b> $' + String.valueOf((AJE.Total_Amount__c != null ? AJE.Total_Amount__c.setScale(2) : 0)) + '<br/><br/>' +
                    
                        '<b>Bank Details:</b><br/>' +
                        '<b>Bank Name:</b> ' + org.Bank__c + '<br/>' +
                        '<b>Account Name:</b> ' + org.Account_Name__c + '<br/>' +
                        '<b>BSB:</b> ' + org.BSB__c + '<br/>' +
                        '<b>Account Number:</b> ' + org.Account_Number__c + '<br/><br/>' +
                    
                        'Kindly process the payment. If you have any questions or need further clarification, feel free to reach out.<br/><br/>' +
                        'Thank you for your continued partnership.' ;
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
                SELECT Id, Name, Email__c, Bank__c, Account_Name__c, BSB__c, Account_Number__c 
                FROM Organisation__c 
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];
            System.debug('org >> ' + org);
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
            
            // HTTP Callout to get PDF
            Http http = new Http();
            HttpRequest req = new HttpRequest();
            req.setEndpoint(url);
            req.setMethod('GET');
            req.setTimeout(60000);
            
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() != 200) {
                throw new AuraHandledException('Failed to download invoice PDF. Status code: ' + res.getStatusCode());
            }
            Blob fileBody = res.getBodyAsBlob();
                
                // Prepare email attachment
                Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
                attachment.setFileName(AJE.Name+'.pdf');
                attachment.setBody(fileBody);
                attachment.setContentType('application/pdf');
            
            System.debug('AJE >> ' + AJE);
                                
                // Compose email
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                if (String.isNotBlank(toAddress)) {
                    email.setToAddresses(toAddress.split('\\s*,\\s*'));
                }
            System.debug('AJE >> ' + AJE);
                if (String.isNotBlank(ccAddress)) {
                    email.setCcAddresses(new List<String>{ ccAddress });
                }
            System.debug('AJE >> ' + AJE);
                email.setSubject(subject);
            System.debug('AJE >> ' + AJE);
                email.setHtmlBody(body);
            System.debug('AJE >> ' + AJE);  
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
            
            System.debug('AJE >> ' + AJE);
            System.debug('email >> ' + email);
            System.debug('To Addresses: ' + email.getToAddresses());
            System.debug('CC Addresses: ' + email.getCcAddresses());
            System.debug('BCC Addresses: ' + email.getBccAddresses());
            System.debug('Subject: ' + email.getSubject());
                
                // Send the email
                Messaging.sendEmail(new List<Messaging.Email>{ email });
            
            System.debug('AJE >> ' + AJE);
                
               
                AJE.Email_Count__c = (AJE.Email_Count__c == null) ? 1 : AJE.Email_Count__c + 1;
                update AJE ;
            
            System.debug('AJE >> ' + AJE);
        
                // ✅ Return updated count
                return AJE.Email_Count__c;
    
           
            
        } catch (Exception ex) {
            //throw new AuraHandledException('Error sending invoice email: ' + ex.getMessage());
            return 0;
        }
    }
	 public static String formatDateDDMMYYYY(Date inputDate) {
        String day = inputDate.day() < 10 ? '0' + inputDate.day() : String.valueOf(inputDate.day());
        String month = inputDate.month() < 10 ? '0' + inputDate.month() : String.valueOf(inputDate.month());
        String year = String.valueOf(inputDate.year());
        return day + '/' + month + '/' + year;
    }
}