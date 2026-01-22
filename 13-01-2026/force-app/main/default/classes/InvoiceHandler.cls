/**
* @description       : 
* @author            : Raja Sekhar Reddy
* @group             : 
* @last modified on  : 07-19-2023
* @last modified by  : Raja Sekhar Reddy
**/
public with sharing class InvoiceHandler {
    @AuraEnabled(cacheable = true)
    public static imageWrapper organizationDetails(){
        imageWrapper imgwrapp= new imageWrapper();
        User userDetails = [Select Organization_Name__c From User Where Id = :UserInfo.getUserId()];
        System.debug('user details'+userDetails.Organization_Name__c);
        If(!Test.isRunningTest()){
            Organisation__c orgDetails=[select Id,Name,ABN__c,ACN__c,Address_Latest__c,Contact_No__c,Accounting_Services__c,
                                        NDIS_Provider__c,Organization_Logo__c,Account_Name__c,Account_Number__c,
                                        Bank__c,BSB__c,Description__c,RCTI__c,Address_Latest__Street__s, Auto_Approve_Buffer__c, 
                                        Address_Latest__City__s,Address_Latest__StateCode__s,Address_Latest__CountryCode__s,Facility_Preferred_Name_Formula__c,Participant_Preferred_Name_Formula__c,
                                        Address_Latest__PostalCode__s,Roles__c,Type_of_User__c,Other_than_NDIS_User__c  from Organisation__c where Name=:userDetails.Organization_Name__c];
            System.debug('Org Details '+orgDetails);
            
            Matcher imgMatcher = Pattern.compile( '<img(.+?)>' ).matcher( orgDetails.Organization_Logo__c );
            
            // iterate each image tag found
            while ( imgMatcher.find() ) {
                
                String imageTag = imgMatcher.group(); String imageURL = imageTag.substringBetween( ' src="', '"' );
                String decodedURL = imageURL.unescapeHtml4();
                PageReference page=new PageReference(decodedURL);
                Blob imageblob = page.getContent();
                String fileString='data:image/png;base64,'+EncodingUtil.Base64Encode(imageblob);
                imgwrapp.listofPriceBook=orgDetails; imgwrapp.bolbdata=fileString;
            }
        }
        
        return imgwrapp;
    }
    public class imageWrapper{
        @AuraEnabled
        public Organisation__c listofPriceBook{set;get;}
        @AuraEnabled
        public String bolbdata{set;get;}
    }
    
    @AuraEnabled
    public static List<Invoice__c> listofInvoices(String invParentId){
        String invoiceId;
        String invoiceTax;
        return [select Description__c,Rate__c,Quantity__c,Unit_Price__c,Amount__c,Invoice_Parent__c ,Invoice_Parent__r.Date_Issued__c,Invoice_Parent__r.Tax_Invoice__c,Amazon_URL__c,Invoice_Parent__r.Staff__r.Invoice_To__c,Invoice_Parent__r.Include_GST__c,Invoice_Parent__r.Status__c,Invoice_Parent__r.Due_Date__c,
                Invoice_Parent__r.Total_GST__c,Invoice_Parent__r.Total_Amount__c,Invoice_Parent__r.Total__c,Invoice_Parent__r.Name,Invoice_Parent__r.Start_Date__c,Invoice_Parent__r.End_Date__c,Invoice_Parent__r.Invoice_To__c,Invoice_Parent__r.File_Reference__c,Invoice_Parent__r.Amazon_URL__c from Invoice__c 
                where Invoice_Parent__c=:invParentId Order by createddate desc];
    }
    
    @AuraEnabled
    public static List<Invoice_Parent__c> listofInvoicesParent(String sDate,String eDate ,string staffID){
        system.debug('staff ID'+staffID);
        system.debug('staff ID'+sDate);
        system.debug('staff ID'+eDate);
        String invoiceId;
        String invoiceTax;
        String orgId = CurrentUserOrganization.currentOrgId();
        String organizationId;
        If(!Test.isRunningTest())
            organizationId = orgId.substring(0,15);
        Date startDate=Date.valueOf(sDate);
        Date endDate=Date.valueOf(eDate);
        List<Invoice_Parent__c> invList= new List<Invoice_Parent__c>();
        if(staffID !=null){
            invList= [select id,staff__c,Name,Tax_Invoice__c,Date_Issued__c,Start_Date__c,End_Date__c,Total_GST__c,Total_Amount__c,Organization__c,Total__c,Amazon_URL__c,Staff__r.Invoice_To__c,Invoice_To__c,File_Name__c,CSV_Descriprion__c,Final_CSV_Total__c,Total_CSV_GST__c,Is_Created_From_CSV__c,
                      Status__c,File_Reference__c,(SELECT ID,Description__c	FROM Invoices__r) from Invoice_Parent__c  where Start_Date__c >=:startDate and End_Date__c <=: endDate
                      and Organization__c=: organizationId  AND staff__c =:staffID Order by createddate desc];
            system.debug(' if Invoice List'+invList);
        } else{
            invList= [select id,staff__c,Name,Tax_Invoice__c,Date_Issued__c,Start_Date__c,End_Date__c,Total_GST__c,Total_Amount__c,Organization__c,Total__c,Amazon_URL__c,Staff__r.Invoice_To__c,Invoice_To__c,File_Name__c,CSV_Descriprion__c,Final_CSV_Total__c,Total_CSV_GST__c,Is_Created_From_CSV__c,
                      Status__c,File_Reference__c,(SELECT ID,Description__c FROM Invoices__r) from Invoice_Parent__c  where Date_Issued__c >=:startDate and Date_Issued__c <=: endDate
                      and Organization__c=: organizationId   Order by createddate desc]; 
            system.debug(' else Invoice List'+invList);
        }
        return invList;
    }
    
    @AuraEnabled
    public static Invoice_Parent__c insertInvoice(String JsonString,String OrgId,String dateIssue,String invoice, String includeGst, string startDate,string enddate,string staffID, String invoiceTo,
                                                  string dueDate,string invoiceStatus,string fileref,string invName ){
                                                      system.debug(JsonString);
                                                      System.debug('include gst> '+ includeGst);
                                                      System.debug('due date> '+ dueDate);
                                                      String invoiceId;
                                                      String invoiceTax;
                                                      list<Invoice_Parent__c> existInvlist=[select id from Invoice_Parent__c where Name=:invName];
                                                      Invoice_Parent__c invParent = new Invoice_Parent__c();
                                                      if(existInvlist.size()>0){
                                                          invParent.id=existInvlist[0].id;                                             
                                                      }                                          
                                                      
                                                      invParent.Organization__c=orgId;
                                                      invParent.Date_Issued__c=Date.valueOf(dateIssue);
                                                      if(startDate != null){
                                                          invParent.Start_Date__c=Date.valueOf(startDate);   
                                                      }
                                                      if(enddate !=null){
                                                          invParent.End_Date__c=Date.valueOf(enddate);    
                                                      }
                                                      if(staffID != null){
                                                          invParent.Staff__c= staffID;
                                                      }
                                                      if(dueDate != null && !String.isBlank(dueDate) ){
                                                          invParent.Due_Date__c=Date.valueOf(dueDate);   
                                                      }
                                                      if(invoiceStatus != null){
                                                          invParent.Status__c=invoiceStatus;   
                                                      }
                                                      if(fileref != null){
                                                          invParent.File_Reference__c=fileref;   
                                                      }
                                                      
                                                      invParent.Tax_Invoice__c=invoice;
                                                      invParent.Include_GST__c= includeGst;
                                                      invParent.Invoice_To__c = invoiceTo;
                                                      if(existInvlist.size()>0){
                                                          update invParent;
                                                      }else{
                                                          insert invParent;  
                                                      }
                                                      
                                                      if(invParent.Id!=null){
                                                          List<invoiceWrapper> invoiceList = (List<invoiceWrapper>)System.JSON.deserialize(JsonString,List<invoiceWrapper>.class);
                                                          list<Invoice__c> existChildInvlist=[select id,Description__c,Quantity__c,Invoice_Parent__c,Include_GST__c from Invoice__c where Invoice_Parent__c=:invParent.Id];
                                                          if(existChildInvlist.size()>0){
                                                              delete existChildInvlist;
                                                          }
                                                          List<Invoice__c> invList=new List<Invoice__c>();
                                                          system.debug('invoiceList'+invoiceList);        
                                                          for(invoiceWrapper invRecord:invoiceList){
                                                              if(invRecord.description !=''){
                                                                  Invoice__c invRec= new Invoice__c();
                                                                  invRec.Description__c=invRecord.description;
                                                                  // invRec.Rate__c=Decimal.valueOf(invRecord.rate);
                                                                  invRec.Quantity__c=Decimal.valueOf(invRecord.quantity);
                                                                  invRec.Unit_Price__c=Decimal.valueOf(invRecord.unitPrice);
                                                                  invRec.Invoice_Parent__c=invParent.Id;
                                                                  invRec.Include_GST__c = includeGst;
                                                                  invList.add(invRec);
                                                              }
                                                          }
                                                          if(invList.size()>0){
                                                              insert invList;
                                                          }
                                                      }
                                                      return invParent;
                                                  }
    
    public class invoiceWrapper{
        public String description;  
        //public String rate;
        public String quantity;
        public String unitPrice;        
    }
    
    
    @AuraEnabled
    public static Invoice_Parent__c updateInvoice(string invID,string statusVal,string typeOfUpdate){
        Invoice_Parent__c invRec=[select id,Status__c from Invoice_Parent__c where id=:invID];
        if(typeOfUpdate=='Status'){
            if(statusVal=='Received'){
                invRec.Status__c=statusVal;    
            } 
            if(statusVal=='Issued'){
                invRec.Status__c=statusVal;
                invRec.Email_Sent__c=false; 
            }
            
        }
        if(typeOfUpdate=='Email'){
            invRec.Email_Sent__c=true; 
        }
        
        update invRec;
        return invRec;
    }
    
    @AuraEnabled
    public static Facility__c saveSearchKey(String emailKey) { 
        Facility__c fac; 
        try{
            system.debug('email key '+emailKey);
            String UserEmail = UserInfo.getUserEmail(); 
            Id userId =UserInfo.getUserId();
            string facID;
            List<Staff__c> staffData=[SELECT id,Name,role__c,Facility__c FROM Staff__c 
                                      WHERE Email_Address__c =:UserEmail LIMIT 1];
            facID = staffData[0].Facility__c ;
            List<Facility__c> facRecords = [SELECT Id, Key_Words__c,Email_Keywords__c FROM Facility__c where id=:facID LIMIT 1];
            system.debug('key words '+facRecords[0].Email_Keywords__c);
            if (!facRecords.isEmpty()) {
                fac = facRecords[0];
                if (String.isBlank(fac.Email_Keywords__c)) {
                    fac.Email_Keywords__c = emailKey;
                } else {
                    fac.Email_Keywords__c += ' ' + emailKey;
                }
                
                update fac;
                system.debug('key words '+fac);
            } 
        }catch (Exception e){
            throw new AuraHandledException(e.getMessage());
        }
        return fac;
    }
    
    @AuraEnabled(cacheable=true)
    public static String getSearchKeys() {
        String userEmail = UserInfo.getUserEmail(); 
        List<Staff__c> staffData = [SELECT id,Facility__c,Facility__r.Key_Words__c ,Facility__r.Email_Keywords__c FROM Staff__c WHERE Email_Address__c = :userEmail LIMIT 1];
        if (!staffData.isEmpty()) {
            return staffData[0].Facility__r.Email_Keywords__c;
            
        }
        return null;
    }
    @AuraEnabled(cacheable=true)
    public static void sendEmail(String base64,String staffEmail,String orgName,string fileName) {
        String sendTouser = staffEmail;
        system.debug('orgname '+orgName);
        String base64Content = ( String ) JSON.deserialize( base64, String.class );
        Blob attachmentBody = EncodingUtil.base64Decode(base64Content);
        
        Messaging.SingleEmailMessage semail = new Messaging.SingleEmailMessage();
        OrgWideEmailAddress oweaddress = [select Id,DisplayName from OrgWideEmailAddress where Address =:System.Label.OrgWideEmailAddress limit 1];
        semail.setOrgWideEmailAddressId(oweaddress.Id);
        String[] sendingTo = new String[]{sendTouser};
            semail.setToAddresses(sendingTo);
        
        Messaging.EmailFileAttachment efa = new Messaging.EmailFileAttachment();
        efa.setFileName(fileName);
        efa.setBody(attachmentBody);
        semail.setFileAttachments(new Messaging.EmailFileAttachment[] {efa});
        semail.setSaveAsActivity(true);
        //semail.setSenderDisplayName(orgName);
        
        semail.setSubject('Invoice');
        semail.setPlainTextBody('Hi,\n\nPlease find the attached invoice.\n\nThis is a computer-generated invoice and no reply is required.\n\nThanks & Regards,\nAdministrator\n' + orgName);
        Messaging.sendEmail(new Messaging.SingleEmailMessage[] {semail});
    }
    @AuraEnabled
    public static list<Invoice_Parent__History> getInvoiceParentHistory(string parentID){
        return [SELECT Id,parent.name, Field,  NewValue, OldValue,parent.LastModifiedDate,parent.createddate,parent.createdby.name,parent.lastmodifiedbyid,parent.LastModifiedBy.Name FROM Invoice_Parent__History
                where parent.id=:parentID order by createddate desc];
    }
    @AuraEnabled
    public static List<Accounting_Invoices_Expenses__c> getAccountingInvoiceById(String invoiceId) {
        // Initialize a list to hold the result
        List<Accounting_Invoices_Expenses__c> InvoiceData = new List<Accounting_Invoices_Expenses__c>();
        if (invoiceId != null) {
            // If selectedId is provided, fetch the company with that specific ID
            InvoiceData = [SELECT Id,Name,Invoice_No__c,Company__c,Status__c ,GST__c,Total_Amount__c,Sub_Total__c,Company__r.Company_Name__c,Amazon_URL__c,
                           Company__r.ABN__c,Company__r.Address__c,Company__r.Phone_Number__c,Company__r.Address_Latest__Street__s,Participant__r.First_Name__c,Participant__r.Last_Name__c,Participant__r.Name__c,Participant__r.address__Street__s, Participant__r.address__City__s, Participant__r.address__StateCode__s, Participant__r.Address__CountryCode__s, Participant__r.Address__PostalCode__s,Participant__r.NDIS_Participant_ID__c,
                           Company__r.Address_Latest__City__s,Company__r.Address_Latest__StateCode__s,Company__r.Address_Latest__PostalCode__s,
                           Invoice_Date__c,Start_Date__c,End_Date__c,Issued_Date__c,staff__r.Name, Staff__r.Invoice_To__c,Due_Date__c,(select Id,
                                                                                                   Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,Description__c,Company__c,Entry_Type__c,
                                                                                                   Entity_Profile__c,Invoice_Date__c,Post_Date__c,Invoice_No__c,Comments__c,Entity_Profile__r.First_Name__c,
                                                                                                   Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c,Notes__c,Entity_Profile__r.Id,Service_Cancel__c,Service_Cancel_Payment__c,
                                                                                                   Unit_Price__c,Quantity__c,Tax__c,Line_Items__c from Accounting_Journal_Entry__r where Unit_Price__c != null and Quantity__c != null and Tax__c != null )
                           FROM Accounting_Invoices_Expenses__c 
                           WHERE Id =: invoiceId];
            System.debug('InvoiceData for companyId: ' + JSON.serialize(InvoiceData));
        }
        return InvoiceData;
    }
    @AuraEnabled
    public static List<Accounting_Invoices_Expenses__c> getAccountingInvoiceInEdit(String invoiceId) {
        // Initialize a list to hold the result
        List<Accounting_Invoices_Expenses__c> InvoiceData = new List<Accounting_Invoices_Expenses__c>();
        if (invoiceId != null) {
            // If selectedId is provided, fetch the company with that specific ID
            InvoiceData = [SELECT Id,Invoice_No__c,Name,Company__c,Status__c ,Sub_Total__c,GST__c,Total_Amount__c,Company__r.Company_Name__c,
                           Company__r.ABN__c,Company__r.Address__c,Company__r.Phone_Number__c,Company__r.Address_Latest__Street__s,Due_Date__c,
                           Company__r.Address_Latest__City__s,Company__r.Address_Latest__StateCode__s,Company__r.Address_Latest__PostalCode__s,
                           Invoice_Date__c,Post_Date__c,Include_GST__c,Participant__r.First_Name__c, Participant__r.Last_Name__c,Is_Service_Invoice__c,Is_Payroll_Sales__c,
                           (select Id,Tax_Amount__c,Total_Amount__c,Sub_Total__c,Amount__c, Accounting_Ledger_Items__c,Description__c,Company__c,
                            Entry_Type__c,Entity_Profile__c,Invoice_Date__c,Post_Date__c,Invoice_No__c,Comments__c,Sl_no__c,Tax_Inclusive__c,
                            Accounting_Ledger_Items__r.Account_Number__c,Accounting_Ledger_Items__r.Name,Entity_Profile__r.First_Name__c,
                            Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c,Unit_Price__c,Quantity__c,Tax__c,Line_Items__c,Notes__c ,Entity_Profile_Name__c
                            from Accounting_Journal_Entry__r where Unit_Price__c != null AND Quantity__c != null AND Tax__c != null)
                           FROM Accounting_Invoices_Expenses__c 
                           WHERE Id =: invoiceId];
            System.debug('InvoiceData for companyId: ' + JSON.serialize(InvoiceData));
        }
        return InvoiceData;
    }
    
  /*  @AuraEnabled
    public static void sendEmailforInvoice(
        Id invoiceid,
        String toAddress, 
        String ccAddress, 
        String url, 
        Date invoiceStartDate, 
        Date invoiceEndDate
    ) {
        try {
            System.debug('invoiceid >> ' + invoiceid);
            
            // Get current user and organization
            Id currentUserId = UserInfo.getUserId();
            User u = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId];
            
            Organisation__c org = [
                SELECT Id, Name, Email__c, Bank__c, Account_Name__c, BSB__c, Account_Number__c 
                FROM Organisation__c 
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];
            
            // Get Invoice Record
            Accounting_Journal_Entry__c AJE = [
                SELECT Id, Invoice_No__c, Invoice_Date__c, Total_Amount__c,Accounting_Invoices_Expenses__r.Total_Amount__c,Name, 
                Accounting_Invoices_Expenses__r.Amazon_URL__c, Accounting_Invoices_Expenses__r.Name,Accounting_Invoices_Expenses__r.Issued_Date__c,
                Company__r.Company_Name__c ,Entity_Profile__c, Entity_Profile__r.First_Name__c,
                            Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c 
                FROM Accounting_Journal_Entry__c 
                WHERE Id = :invoiceid
            ];
            
            Entity_Profile__c entity = AJE.Entity_Profile__r;

            // Build the entity name
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
            String formattedStartDate = formatDateDDMMYYYY(invoiceStartDate);
            String formattedEndDate = formatDateDDMMYYYY(invoiceEndDate);
            String formattedIssueDate = formatDateDDMMYYYY(AJE.Invoice_Date__c);
           // Date dueDate = AJE.Invoice_Date__c != null ? AJE.Invoice_Date__c.addDays(14) : Date.today().addDays(14);
             Date dueDate = AJE.Accounting_Invoices_Expenses__r.Issued_Date__c; 
            String formattedDueDate = formatDateDDMMYYYY(dueDate);
            
            // HTTP Callout to get PDF
            Http http = new Http();
            HttpRequest req = new HttpRequest();
            req.setEndpoint(url);
            req.setMethod('GET');
            req.setTimeout(60000);
            
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() == 200) {
                Blob fileBody = res.getBodyAsBlob();
                
                // Prepare email attachment
                Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
                attachment.setFileName(AJE.Accounting_Invoices_Expenses__r.Name+'.pdf');
                attachment.setBody(fileBody);
                attachment.setContentType('application/pdf');
                                
                // Compose email
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                email.setToAddresses(new List<String>{ toAddress });
                
                if (String.isNotBlank(ccAddress)) {
                    email.setCcAddresses(new List<String>{ ccAddress });
                }
                
                email.setSubject('Invoice ' + AJE.Accounting_Invoices_Expenses__r.Name + ' – ' + formattedStartDate + ' to ' + formattedEndDate);
                //email.setPlainTextBody(emailBody);
                email.setHtmlBody(
                        'Dear <b>' + entityName + '</b>,<br/><br/>' +
                        'Please find attached the tax invoice <b>' + AJE.Accounting_Invoices_Expenses__r.Name + '</b> for the billing period <b>' +
                        formattedStartDate + '</b> to <b>' + formattedEndDate + '</b>, issued by <b>' + org.Name + '</b>.<br/><br/>' +
                    
                        '<b>Invoice Summary:</b><br/>' +
                        '<b>Invoice Number:</b> ' + AJE.Accounting_Invoices_Expenses__r.Name + '<br/>' +
                        '<b>Date Issued:</b> ' + formattedIssueDate + '<br/>' +
                        '<b>Due Date:</b> ' + formattedDueDate + '<br/>' +
                        '<b>Total Amount:</b> $' + String.valueOf(AJE.Accounting_Invoices_Expenses__r.Total_Amount__c.setScale(2)) + '<br/><br/>' +
                    
                        '<b>Bank Details:</b><br/>' +
                        '<b>Bank Name:</b> ' + org.Bank__c + '<br/>' +
                        '<b>Account Name:</b> ' + org.Account_Name__c + '<br/>' +
                        '<b>BSB:</b> ' + org.BSB__c + '<br/>' +
                        '<b>Account Number:</b> ' + org.Account_Number__c + '<br/><br/>' +
                    
                        'Kindly process the payment by the due date. If you have any questions or need further clarification, feel free to reach out.<br/><br/>' +
                        'Thank you for your continued partnership.'
                    );

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
                
            } else {
                throw new AuraHandledException('Failed to download file. Status code: ' + res.getStatusCode());
            }
            
        } catch (Exception ex) {
            throw new AuraHandledException('Error sending invoice email: ' + ex.getMessage());
        }
    }*/
    
   /* @AuraEnabled
    public static Decimal sendEmailforInvoiceforSales(
        Id invoiceid,
        String toAddress, 
        String ccAddress, 
        String url,
        Date invoiceDate
    ) {
        try {
            System.debug('invoiceid >> ' + invoiceid);
            System.debug('toAddress >> ' + toAddress);
            System.debug('ccAddress >> ' + ccAddress);
            System.debug('url >> ' + url);
            System.debug('invoiceDate >> ' + invoiceDate);
            
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
           	Date dueDate = AJE.Due_Date__c;
            String formattedDueDate = formatDateDDMMYYYY(dueDate);
           // String fileName = AJE.Name;
            System.debug('formattedDueDate >> ' + formattedDueDate);    
            
            // HTTP Callout to get PDF
            Http http = new Http();
            HttpRequest req = new HttpRequest();
            req.setEndpoint(url);
            req.setMethod('GET');
            req.setTimeout(60000);
            
            HttpResponse res = http.send(req);
            
            if (res.getStatusCode() == 200) {
                Blob fileBody = res.getBodyAsBlob();
                
                // Prepare email attachment
                Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
                attachment.setFileName(AJE.Name+'.pdf');
                attachment.setBody(fileBody);
                attachment.setContentType('application/pdf');
                                
                // Compose email
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                email.setToAddresses(new List<String>{ toAddress });
                
                if (String.isNotBlank(ccAddress)) {
                    email.setCcAddresses(new List<String>{ ccAddress });
                }
                
                email.setSubject('Invoice ' + AJE.Name + ' is generated on '+ formattedIssueDate );
                //email.setPlainTextBody(emailBody);
                email.setHtmlBody(
                        'Dear <b>' + entityName + '</b>,<br/><br/>' +
                        'Please find attached the tax invoice <b>' + AJE.Name + '</b> is Generated on <b>' +  formattedIssueDate +
                         '</b>, issued by <b>' + org.Name + '</b>.<br/><br/>' +
                    
                        '<b>Invoice Summary:</b><br/>' +
                        '<b>Invoice Number:</b> ' + AJE.Name + '<br/>' +
                        '<b>Date Issued:</b> ' + formattedIssueDate + '<br/>' +
                        '<b>Due Date:</b> ' + formattedDueDate + '<br/>' +
                        '<b>Total Amount:</b> $' + String.valueOf(AJE.Total_Amount__c.setScale(2)) + '<br/><br/>' +
                    
                        '<b>Bank Details:</b><br/>' +
                        '<b>Bank Name:</b> ' + org.Bank__c + '<br/>' +
                        '<b>Account Name:</b> ' + org.Account_Name__c + '<br/>' +
                        '<b>BSB:</b> ' + org.BSB__c + '<br/>' +
                        '<b>Account Number:</b> ' + org.Account_Number__c + '<br/><br/>' +
                    
                        'Kindly process the payment by the due date. If you have any questions or need further clarification, feel free to reach out.<br/><br/>' +
                        'Thank you for your continued partnership.'
                    );

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
                
               
                AJE.Email_Count__c = (AJE.Email_Count__c == null) ? 1 : AJE.Email_Count__c + 1;
                update AJE ;
        
                // ✅ Return updated count
                return AJE.Email_Count__c;
    
            } else {
                throw new AuraHandledException('Failed to download file. Status code: ' + res.getStatusCode());
            }
            
        } catch (Exception ex) {
            throw new AuraHandledException('Error sending invoice email: ' + ex.getMessage());
        }
    }*/
     @AuraEnabled
    public static  Map<String, String> getEmailBody(
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
           	Date dueDate = AJE.Due_Date__c;
            String formattedDueDate = formatDateDDMMYYYY(dueDate);
           // String fileName = AJE.Name;
            System.debug('formattedDueDate >> ' + formattedDueDate);    
            
            Map<String, String> result = new Map<String, String>();
   			String subject =  'Invoice ' + AJE.Invoice_No__c + ' is generated on ' + formattedIssueDate;
   			String body = 
                        'Dear <b>' + entityName + '</b>,<br/><br/>' +
                        'Please find attached the tax invoice <b>' + AJE.Invoice_No__c + '</b> is Generated on <b>' +  formattedIssueDate +
                         '</b>, issued by <b>' + org.Name + '</b>.<br/><br/>' +
                    
                        '<b>Invoice Summary:</b><br/>' +
                        '<b>Invoice Number:</b> ' + AJE.Invoice_No__c + '<br/>' +
                        '<b>Date Issued:</b> ' + formattedIssueDate + '<br/>' +
                        '<b>Due Date:</b> ' + formattedDueDate + '<br/>' +
                        '<b>Total Amount:</b> $' + String.valueOf(AJE.Total_Amount__c.setScale(2)) + '<br/><br/>' +
                    
                        '<b>Bank Details:</b><br/>' +
                        '<b>Bank Name:</b> ' + org.Bank__c + '<br/>' +
                        '<b>Account Name:</b> ' + org.Account_Name__c + '<br/>' +
                        '<b>BSB:</b> ' + org.BSB__c + '<br/>' +
                        '<b>Account Number:</b> ' + org.Account_Number__c + '<br/><br/>' +
                    
                        'Kindly process the payment by the due date. If you have any questions or need further clarification, feel free to reach out.<br/><br/>' +
                        'Thank you for your continued partnership.' ;
                
                	result.put('subject', subject);
        			result.put('body', body);
                   return result;
   
           
            
        } catch (Exception ex) {
            throw new AuraHandledException('Error sending invoice email: ' + ex.getMessage());
        }
    }
	 @AuraEnabled
    public static Decimal sendEmailforInvoiceforSales(Id invoiceid, String toAddress, String ccAddress, String url, String subject,String body) {
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
                attachment.setFileName(AJE.Invoice_No__c+'.pdf');
                attachment.setBody(fileBody);
                attachment.setContentType('application/pdf');
                                
                // Compose email
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                if (String.isNotBlank(toAddress)) {
                    email.setToAddresses(toAddress.split('\\s*,\\s*'));
                }
                
                if (String.isNotBlank(ccAddress)) {
                   // email.setCcAddresses(new List<String>{ ccAddress });
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
                
               
                AJE.Email_Count__c = (AJE.Email_Count__c == null) ? 1 : AJE.Email_Count__c + 1;
                update AJE ;
        
                // ✅ Return updated count
                return AJE.Email_Count__c;
    
           
            
        } catch (Exception ex) {
            throw new AuraHandledException('Error sending invoice email: ' + ex.getMessage());
        }
    }
     @AuraEnabled
    public static Decimal sendEmailforInvoice(
        Id invoiceid,
        String toAddress, 
        String ccAddress, 
        String url, 
        Date invoiceStartDate, 
        Date invoiceEndDate,
        String subject,
        String body
    ) {
        try {
            System.debug('invoiceid >> ' + invoiceid);
            
            // Get current user and organization
            Id currentUserId = UserInfo.getUserId();
            User u = [SELECT Id, Organization_Name__c FROM User WHERE Id = :currentUserId];
            
            Organisation__c org = [
                SELECT Id, Name, Email__c, Bank__c, Account_Name__c, BSB__c, Account_Number__c 
                FROM Organisation__c 
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];
            
            // Get Invoice Record
            Accounting_Journal_Entry__c AJE = [
                SELECT Id, Invoice_No__c, Invoice_Date__c, Total_Amount__c,Accounting_Invoices_Expenses__r.Total_Amount__c,Name, 
                Accounting_Invoices_Expenses__r.Amazon_URL__c, Accounting_Invoices_Expenses__r.Name,Accounting_Invoices_Expenses__r.Issued_Date__c,
                Company__r.Company_Name__c ,Entity_Profile__c, Entity_Profile__r.First_Name__c, Accounting_Invoices_Expenses__r.Email_Count__c,
                            Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c , Accounting_Invoices_Expenses__r.Invoice_No__c
                FROM Accounting_Journal_Entry__c 
                WHERE Id = :invoiceid
            ];
            
            Entity_Profile__c entity = AJE.Entity_Profile__r;

            // Build the entity name
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
            String formattedStartDate = formatDateDDMMYYYY(invoiceStartDate);
            String formattedEndDate = formatDateDDMMYYYY(invoiceEndDate);
            String formattedIssueDate = formatDateDDMMYYYY(AJE.Invoice_Date__c);
           // Date dueDate = AJE.Invoice_Date__c != null ? AJE.Invoice_Date__c.addDays(14) : Date.today().addDays(14);
             Date dueDate = AJE.Accounting_Invoices_Expenses__r.Issued_Date__c; 
            String formattedDueDate = formatDateDDMMYYYY(dueDate);
            
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
                attachment.setFileName(AJE.Accounting_Invoices_Expenses__r.Name+'.pdf');
                attachment.setBody(fileBody);
                attachment.setContentType('application/pdf');
                                
                // Compose email
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                if (String.isNotBlank(toAddress)) {
                    email.setToAddresses(toAddress.split('\\s*,\\s*'));
                }
                
                if (String.isNotBlank(ccAddress)) {
                   // email.setCcAddresses(new List<String>{ ccAddress });
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
          		AJE.Accounting_Invoices_Expenses__r.Email_Count__c = (AJE.Accounting_Invoices_Expenses__r.Email_Count__c == null) ? 1 : AJE.Accounting_Invoices_Expenses__r.Email_Count__c + 1;
                update AJE ;
        
                // ✅ Return updated count
                return AJE.Accounting_Invoices_Expenses__r.Email_Count__c;
                
          
        } catch (Exception ex) {
            throw new AuraHandledException('Error sending invoice email: ' + ex.getMessage());
        }
    }
     @AuraEnabled
    public static  Map<String, String> getEmailBodyICT(
        Id invoiceid,
        Date invoiceStartDate, 
        Date invoiceEndDate
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
            Accounting_Journal_Entry__c AJE = [
                SELECT Id, Invoice_No__c, Invoice_Date__c, Total_Amount__c,Accounting_Invoices_Expenses__r.Total_Amount__c,Name, 
                Accounting_Invoices_Expenses__r.Amazon_URL__c, Accounting_Invoices_Expenses__r.Name,Accounting_Invoices_Expenses__r.Issued_Date__c,
                Company__r.Company_Name__c ,Entity_Profile__c, Entity_Profile__r.First_Name__c, Accounting_Invoices_Expenses__r.Email_Count__c,
                            Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c 
                FROM Accounting_Journal_Entry__c 
                WHERE Id = :invoiceid
            ];
            System.debug('AJE >> ' + AJE);
             Entity_Profile__c entity = AJE.Entity_Profile__r;

            // Build the entity name
            String entityName = '';
            if (entity != null) {
                if (!String.isBlank(entity.First_Name__c) || !String.isBlank(entity.Last_Name__c)) {
                    entityName = (entity.First_Name__c != null ? entity.First_Name__c + ' ' : '') +
                                 (entity.Last_Name__c != null ? entity.Last_Name__c : '');
                } else {
                    entityName = entity.Name__c;
                }
			}
             String formattedStartDate = formatDateDDMMYYYY(invoiceStartDate);
            String formattedEndDate = formatDateDDMMYYYY(invoiceEndDate);
            String formattedInvoiceDate = formatDateDDMMYYYY(AJE.Invoice_Date__c);
           // Date dueDate = AJE.Invoice_Date__c != null ? AJE.Invoice_Date__c.addDays(14) : Date.today().addDays(14);
             Date dueDate = AJE.Accounting_Invoices_Expenses__r.Issued_Date__c; 
            String formattedDueDate = formatDateDDMMYYYY(dueDate);
            
            Map<String, String> result = new Map<String, String>();
   			String subject =  'Invoice ' + AJE.Accounting_Invoices_Expenses__r.Name + ' – ' + formattedStartDate + ' to ' + formattedEndDate;
   			String body = 
                      'Dear <b>' + entityName + '</b>,<br/><br/>' +
                        'Please find attached the tax invoice <b>' + AJE.Accounting_Invoices_Expenses__r.Name + '</b> for the billing period <b>' +
                        formattedStartDate + '</b> to <b>' + formattedEndDate + '</b>, issued by <b>' + org.Name + '</b>.<br/><br/>' +
                    
                        '<b>Invoice Summary:</b><br/>' +
                        '<b>Invoice Number:</b> ' + AJE.Accounting_Invoices_Expenses__r.Name + '<br/>' +
                        '<b>Date Issued:</b> ' + formattedInvoiceDate + '<br/>' +
                        '<b>Due Date:</b> ' + formattedDueDate + '<br/>' +
                        '<b>Total Amount:</b> $' + String.valueOf(AJE.Accounting_Invoices_Expenses__r.Total_Amount__c.setScale(2)) + '<br/><br/>' +
                    
                        '<b>Bank Details:</b><br/>' +
                        '<b>Bank Name:</b> ' + org.Bank__c + '<br/>' +
                        '<b>Account Name:</b> ' + org.Account_Name__c + '<br/>' +
                        '<b>BSB:</b> ' + org.BSB__c + '<br/>' +
                        '<b>Account Number:</b> ' + org.Account_Number__c + '<br/><br/>' +
                    
                        'Kindly process the payment by the due date. If you have any questions or need further clarification, feel free to reach out.<br/><br/>' +
                        'Thank you for your continued partnership.';
                
                	result.put('subject', subject);
        			result.put('body', body);
                   return result;
   
           
            
        } catch (Exception ex) {
            throw new AuraHandledException('Error sending invoice email: ' + ex.getMessage());
        }
    }
    
  /*  @AuraEnabled
    public static Decimal sendEmailforInvoiceforPurchases(
        Id invoiceid,
        String toAddress, 
        String ccAddress
    ) {
        try {
            System.debug('invoiceid >> ' + invoiceid);
            System.debug('toAddress >> ' + toAddress);
            System.debug('ccAddress >> ' + ccAddress);
            
            
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
                SELECT Id,Company__r.Company_Name__c,Invoice_Date__c, Invoice_No__c, Total_Amount__c,Amazon_URL__c,Name,Due_Date__c,Email_Count__c,
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
            System.debug('AJE >> ' + AJE);
            String formattedIssueDate = formatDateDDMMYYYY(AJE.Invoice_Date__c);
            System.debug('formattedIssueDate >> ' + formattedIssueDate);
            //Date dueDate = AJE.Invoice_Date__c != null ? AJE.Invoice_Date__c.addDays(14) : Date.today().addDays(14);
            Date dueDate = AJE.Due_Date__c;
            String formattedDueDate = formatDateDDMMYYYY(dueDate);
            System.debug('formattedDueDate >> ' + formattedDueDate);    
            
            // HTTP Callout to get PDF
            Http http = new Http();
            System.debug('formattedDueDate >> ' + formattedDueDate); 
            HttpRequest req = new HttpRequest();
            System.debug('formattedDueDate >> ' + formattedDueDate); 
            req.setEndpoint(AJE.Amazon_URL__c);
            System.debug('formattedDueDate >> ' + formattedDueDate); 
            req.setMethod('GET');
            req.setTimeout(60000);
            System.debug('formattedDueDate >> ' + formattedDueDate);
            HttpResponse res = http.send(req);
            System.debug('formattedDueDate >> ' + formattedDueDate);
            if (res.getStatusCode() == 200) {
                Blob fileBody = res.getBodyAsBlob();
                System.debug('formattedDueDate >> ' + formattedDueDate);
                // Prepare email attachment
                Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
                attachment.setFileName(AJE.Name+'.pdf');
                attachment.setBody(fileBody);
                attachment.setContentType('application/pdf');
                                
                // Compose email
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                email.setToAddresses(new List<String>{ toAddress });
                System.debug('formattedDueDate >> ' + formattedDueDate);
                if (String.isNotBlank(ccAddress)) {
                    email.setCcAddresses(new List<String>{ ccAddress });
                }
                System.debug('formattedDueDate >> ' + formattedDueDate);   
                email.setSubject('Invoice ' + AJE.Name + ' is generated on '+ formattedIssueDate );
                //email.setPlainTextBody(emailBody);
                email.setHtmlBody(
                        'Dear <b>' + entityName + '</b>,<br/><br/>' +
                        'Please find attached the tax invoice <b>' + AJE.Name + '</b> is Generated on <b>' +  formattedIssueDate +
                         '</b>, issued by <b>' + org.Name + '</b>.<br/><br/>' +
                    
                        '<b>Invoice Summary:</b><br/>' +
                        '<b>Invoice Number:</b> ' + AJE.Name + '<br/>' +
                        '<b>Date Issued:</b> ' + formattedIssueDate + '<br/>' +
                        '<b>Due Date:</b> ' + formattedDueDate + '<br/>' +
                        '<b>Total Amount:</b> $' + String.valueOf(AJE.Total_Amount__c.setScale(2)) + '<br/><br/>' +
                    
                        '<b>Bank Details:</b><br/>' +
                        '<b>Bank Name:</b> ' + org.Bank__c + '<br/>' +
                        '<b>Account Name:</b> ' + org.Account_Name__c + '<br/>' +
                        '<b>BSB:</b> ' + org.BSB__c + '<br/>' +
                        '<b>Account Number:</b> ' + org.Account_Number__c + '<br/><br/>' +
                    
                        'Kindly process the payment by the due date. If you have any questions or need further clarification, feel free to reach out.<br/><br/>' +
                        'Thank you for your continued partnership.'
                    );

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
                AJE.Email_Count__c = (AJE.Email_Count__c == null) ? 1 : AJE.Email_Count__c + 1;
                update AJE ;
        
                // ✅ Return updated count
                return AJE.Email_Count__c;
                
            } else {
                throw new AuraHandledException('Failed to download file. Status code: ' + res.getStatusCode());
            }
            
        } catch (Exception ex) {
            throw new AuraHandledException('Error sending invoice email: ' + ex.getMessage());
        }
    }*/
     @AuraEnabled
    public static Decimal sendEmailforInvoiceforPurchases(Id invoiceid, String toAddress, String ccAddress, String subject, String body ) {
        try {
            System.debug('invoiceid >> ' + invoiceid);
            System.debug('toAddress >> ' + toAddress);
            System.debug('ccAddress >> ' + ccAddress);
            
            
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
                SELECT Id,Company__r.Company_Name__c,Invoice_Date__c, Invoice_No__c, Total_Amount__c,Amazon_URL__c,Name,Due_Date__c,Email_Count__c,
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
            req.setEndpoint(AJE.Amazon_URL__c);
            req.setMethod('GET');
            req.setTimeout(60000);
            
            HttpResponse res = http.send(req);
            if (res.getStatusCode() != 200) {
                throw new AuraHandledException('Failed to download invoice PDF. Status code: ' + res.getStatusCode());
            }
            Blob fileBody = res.getBodyAsBlob();
                // Prepare email attachment
                Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
                attachment.setFileName(AJE.Invoice_No__c+'.pdf');
                attachment.setBody(fileBody);
                attachment.setContentType('application/pdf');
                                
                // Compose email
                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                email.setToAddresses(new List<String>{ toAddress });
               
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
                AJE.Email_Count__c = (AJE.Email_Count__c == null) ? 1 : AJE.Email_Count__c + 1;
                update AJE ;
        
                // ✅ Return updated count
                return AJE.Email_Count__c;
                
            
        } catch (Exception ex) {
            throw new AuraHandledException('Error sending invoice email: ' + ex.getMessage());
        }
    }
    
    public static String formatDateDDMMYYYY(Date inputDate) {
        String day = inputDate.day() < 10 ? '0' + inputDate.day() : String.valueOf(inputDate.day());
        String month = inputDate.month() < 10 ? '0' + inputDate.month() : String.valueOf(inputDate.month());
        String year = String.valueOf(inputDate.year());
        return day + '/' + month + '/' + year;
    }
    
    @AuraEnabled
    public static void reverseInvoice(String recordId) {
    if (String.isBlank(recordId)) {
        throw new AuraHandledException('Record Id cannot be empty.');
    }

    Accounting_Invoices_Expenses__c acc = [
        SELECT Id, Status__c 
        FROM Accounting_Invoices_Expenses__c 
        WHERE Id = :recordId 
        LIMIT 1
    ];

    acc.Status__c = 'Reversed';

    update acc;
}

    
}