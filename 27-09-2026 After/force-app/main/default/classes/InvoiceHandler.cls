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
            Organisation__c orgDetails=[select Id,Name,ABN__c,ACN__c,Address_Latest__c,Contact_No__c,Accounting_Services__c,Invoice_Format__c,
                                        NDIS_Provider__c,Organization_Logo__c,Account_Name__c,Account_Number__c,Storage_Limit__c,Leave_Loading__c,Part_Time_Leave_Loading_Rate__c,
                                        Bank__c,BSB__c,Description__c,RCTI__c,Address_Latest__Street__s, Auto_Approve_Buffer__c, Week_Start_Day__c,Leave_Loading_Rate__c, Default_View__c,
                                        Address_Latest__City__s,Address_Latest__StateCode__s,Address_Latest__CountryCode__s,Facility_Preferred_Name_Formula__c,Participant_Preferred_Name_Formula__c, Organization_Tier__c,
                                        Address_Latest__PostalCode__s,Roles__c,Shift_Rejection_Hours__c,Type_of_User__c,Other_than_NDIS_User__c,Invoice_Due__c  from Organisation__c where Name=:userDetails.Organization_Name__c];
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
      @AuraEnabled
    public static imageWrapper organizationDetailsForRoster(){
        imageWrapper imgwrapp= new imageWrapper();
        User userDetails = [Select Organization_Name__c From User Where Id = :UserInfo.getUserId()];
        System.debug('user details'+userDetails.Organization_Name__c);
        If(!Test.isRunningTest()){
            Organisation__c orgDetails=[select Id,Name,ABN__c,ACN__c,Address_Latest__c,Contact_No__c,Accounting_Services__c,Invoice_Format__c,
                                        NDIS_Provider__c,Organization_Logo__c,Account_Name__c,Account_Number__c,Storage_Limit__c,Default_Timesheet_Reimbursement_Range__c,Fortnight_Start_Date__c,
                                        Bank__c,BSB__c,Description__c,RCTI__c,Address_Latest__Street__s, Auto_Approve_Buffer__c, Week_Start_Day__c,Organization_Tier__c, Default_View__c,
                                        Address_Latest__City__s,Address_Latest__StateCode__s,Address_Latest__CountryCode__s,Facility_Preferred_Name_Formula__c,Participant_Preferred_Name_Formula__c,
                                        Address_Latest__PostalCode__s,Roles__c,Shift_Rejection_Hours__c,Type_of_User__c,Other_than_NDIS_User__c,Leave_Loading__c,Leave_Loading_Rate__c,Part_Time_Leave_Loading_Rate__c,Invoice_Due__c from Organisation__c where Name=:userDetails.Organization_Name__c];
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
            InvoiceData = [SELECT Id,Name,Invoice_No__c,Company__c,Status__c ,GST__c,Total_Amount__c,Sub_Total__c,Company__r.Company_Name__c,Amazon_URL__c,Is_Create_Manage_Invoice__c,
                           Company__r.ABN__c,Company__r.Address__c,Company__r.Phone_Number__c,Company__r.Address_Latest__Street__s,Participant__r.First_Name__c,Participant__r.Last_Name__c,Participant__r.Name__c,Participant__r.Date_Of_Birth__c,Participant__r.address__Street__s, Participant__r.address__City__s, Participant__r.address__StateCode__s, Participant__r.Address__CountryCode__s, Participant__r.Address__PostalCode__s,Participant__r.NDIS_Participant_ID__c,
                           Company__r.Address_Latest__City__s,Company__r.Address_Latest__StateCode__s,Company__r.Address_Latest__PostalCode__s,Facility__c,Facility__r.ABN__c,
                            Facility__r.Address__Street__s, Facility__r.Address__City__s,Facility__r.Address__StateCode__s, Facility__r.Address__PostalCode__s, Facility__r.Phone__c,
                           Invoice_Date__c,Start_Date__c,End_Date__c,Issued_Date__c,staff__r.Name, Staff__r.Invoice_To__c,Due_Date__c,(select Id,
                                                                                                   Tax_Amount__c,Total_Amount__c,Sub_Total__c,Accounting_Ledger_Items__c,Description__c,Company__c,Entry_Type__c,
                                                                                                   Entity_Profile__c,Invoice_Date__c,Post_Date__c,Invoice_No__c,Comments__c,Entity_Profile__r.First_Name__c,Sl_no__c,
                                                                                                   Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c,Notes__c,Entity_Profile__r.Id,Service_Cancel__c,Service_Cancel_Payment__c,
                                                                                                   Unit_Price__c,Quantity__c,Tax__c,Line_Items__c from Accounting_Journal_Entry__r where Unit_Price__c != null and Quantity__c != null and Tax__c != null  ORDER BY Sl_no__c ASC NULLS LAST)
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
            InvoiceData = [SELECT Id,Invoice_No__c,Name,Company__c,Status__c ,Sub_Total__c,GST__c,Total_Amount__c,Company__r.Company_Name__c,Is_Create_Manage_Invoice__c,Facility__c,
                           Company__r.ABN__c,Company__r.Address__c,Company__r.Phone_Number__c,Company__r.Address_Latest__Street__s,Due_Date__c,Services_Id_List__c,Participant__c,
                           Company__r.Address_Latest__City__s,Company__r.Address_Latest__StateCode__s,Company__r.Address_Latest__PostalCode__s,ICT_Invoice_Entry__c,
                           Invoice_Date__c,Post_Date__c,Include_GST__c,Participant__r.First_Name__c, Participant__r.Last_Name__c,Is_Service_Invoice__c,Is_Payroll_Sales__c,
                           (select Id,Tax_Amount__c,Total_Amount__c,Sub_Total__c,Amount__c, Accounting_Ledger_Items__c,Description__c,Company__c,
                            Entry_Type__c,Entity_Profile__c,Invoice_Date__c,Post_Date__c,Invoice_No__c,Comments__c,Sl_no__c,Tax_Inclusive__c,
                            Accounting_Ledger_Items__r.Account_Number__c,Accounting_Ledger_Items__r.Name,Entity_Profile__r.First_Name__c,
                            Entity_Profile__r.Last_Name__c,Entity_Profile__r.Name__c,Unit_Price__c,Quantity__c,Tax__c,Line_Items__c,Notes__c ,Entity_Profile_Name__c
                            from Accounting_Journal_Entry__r where Unit_Price__c != null AND Quantity__c != null AND Tax__c != null ORDER BY Sl_no__c ASC NULLS LAST)
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
                System.debug('Label Email: ' + System.Label.OrgWideEmailAddress);
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
               // Messaging.sendEmail(new List<Messaging.Email>{ email });
               Messaging.SendEmailResult[] results = Messaging.sendEmail(
                    new List<Messaging.Email>{ email }
                );
                
                if (results != null && results.size() > 0) {
                    if (results[0].isSuccess()) {
                        System.debug('Email sent successfully');
                    } else {
                        System.debug('Email failed to send');
                
                        for (Messaging.SendEmailError err : results[0].getErrors()) {
                            System.debug('Error: ' + err.getMessage());
                        }
                    }
                }
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
    @AuraEnabled
    public static Accounting_Invoices_Expenses__c saveUpdateManageInvoice(
        String salesEntryJson,
        String salesEntryListJson,
        String amountEntryJson,
        String acknowledgedByName 
    ) {
        Accounting_Invoices_Expenses__c invoiceRecord = new Accounting_Invoices_Expenses__c();
        List<Accounting_Journal_Entry__c> journalEntriesToUpdate = new List<Accounting_Journal_Entry__c>();
        List<Accounting_Journal_Entry__c> journalEntriesToInsert = new List<Accounting_Journal_Entry__c>();

        try {
            System.debug('🔵 saveUpdateManageInvoice - salesEntryJson: ' + salesEntryJson);
            System.debug('🔵 saveUpdateManageInvoice - salesEntryListJson: ' + salesEntryListJson);
            System.debug('🔵 saveUpdateManageInvoice - amountEntryJson: ' + amountEntryJson);

            Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
            Map<String, Object> amountEntry = (Map<String, Object>) JSON.deserializeUntyped(amountEntryJson);
            Id facilityId = null;
            if (salesEntry.containsKey('facilityId') && salesEntry.get('facilityId') != null) {
                String facilityIdStr = String.valueOf(salesEntry.get('facilityId'));
                if (String.isNotBlank(facilityIdStr) && (facilityIdStr.length() == 15 || facilityIdStr.length() == 18)) {
                    facilityId = (Id) facilityIdStr;
                }
            }
            System.debug('🟨 facilityId extracted: ' + facilityId);
            Id participantId = null;
            if (salesEntry.containsKey('participantID') && salesEntry.get('participantID') != null) {
                String participantIdStr = String.valueOf(salesEntry.get('participantID'));
                if (String.isNotBlank(participantIdStr) && (participantIdStr.length() == 15 || participantIdStr.length() == 18)) {
                    participantId = (Id) participantIdStr;
                }
            }
            System.debug('🟨 participantId extracted: ' + participantId);
            Id companyId = null;
            if (salesEntry.containsKey('company') && salesEntry.get('company') != null) {
                String companyIdStr = String.valueOf(salesEntry.get('company'));
                if (String.isNotBlank(companyIdStr) && (companyIdStr.length() == 15 || companyIdStr.length() == 18)) {
                    companyId = (Id) companyIdStr;
                }
            }
            System.debug('🟨 companyId extracted: ' + companyId);

            // Id entityProfileId = null;
            // if (salesEntry.containsKey('entityName') && salesEntry.get('entityName') != null) {
            //     String entityIdStr = String.valueOf(salesEntry.get('entityName'));
            //     if (String.isNotBlank(entityIdStr) && (entityIdStr.length() == 15 || entityIdStr.length() == 18)) {
            //         entityProfileId = (Id) entityIdStr;
            //     }
            // }
            // System.debug('🟨 entityProfileId extracted: ' + entityProfileId);


            List<Object> rawList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);
            List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>();
            Set<Id> journalIds = new Set<Id>();

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

            Map<Id, Accounting_Journal_Entry__c> existingJournalEntryMap = new Map<Id, Accounting_Journal_Entry__c>();
            if (!journalIds.isEmpty()) {
                existingJournalEntryMap = new Map<Id, Accounting_Journal_Entry__c>(
                    [SELECT Id, Sl_no__c FROM Accounting_Journal_Entry__c WHERE Id IN :journalIds]
                );
            }

            //String invoiceId = String.valueOf(salesEntry.get('invoiceId'));
           // Boolean isValidId = !String.isBlank(invoiceId) && (invoiceId.length() == 15 || invoiceId.length() == 18);
           Id invoiceId = null;
            if (salesEntry.containsKey('invoiceId') && salesEntry.get('invoiceId') != null) {
                String invoiceIdStr = String.valueOf(salesEntry.get('invoiceId'));
                if (String.isNotBlank(invoiceIdStr) && (invoiceIdStr.length() == 15 || invoiceIdStr.length() == 18)) {
                    invoiceId = (Id) invoiceIdStr;
                }
            }
            Boolean isValidId = invoiceId != null;
            System.debug('🟨 invoiceId extracted: ' + invoiceId + ' | isValidId: ' + isValidId);


            Decimal subTotal = amountEntry.get('subTotal') != null ? Decimal.valueOf(String.valueOf(amountEntry.get('subTotal'))) : 0;
            Decimal taxAmount = amountEntry.get('taxAmount') != null ? Decimal.valueOf(String.valueOf(amountEntry.get('taxAmount'))) : 0;
            Decimal totalAmount = amountEntry.get('totalAmount') != null ? Decimal.valueOf(String.valueOf(amountEntry.get('totalAmount'))) : 0;

            Date invoiceDate = salesEntry.get('InvoiceDate') != null ? Date.valueOf((String)salesEntry.get('InvoiceDate')) : null;
            Date dueDate = salesEntry.get('dueDate') != null ? Date.valueOf((String)salesEntry.get('dueDate')) : null;
            Date postDate = salesEntry.get('PostDate') != null ? Date.valueOf((String)salesEntry.get('PostDate')) : null;

            Boolean existingIsCreateManage = null;
            Boolean existingIsServiceInvoice = null;

            if (isValidId) {
                Accounting_Invoices_Expenses__c existingInvoice = [
                    SELECT Id, Is_Create_Manage_Invoice__c, Is_Service_Invoice__c
                    FROM Accounting_Invoices_Expenses__c
                    WHERE Id = :invoiceId
                    LIMIT 1
                ];
                existingIsCreateManage = existingInvoice.Is_Create_Manage_Invoice__c;
                existingIsServiceInvoice = existingInvoice.Is_Service_Invoice__c;
            }

            String previousServicesList = (String) salesEntry.get('ServicesList');
            //Boolean isServiceInvoice = String.isNotBlank(previousServicesList);
            Boolean isServiceInvoice = isValidId
                        ? (existingIsServiceInvoice == true && String.isNotBlank(previousServicesList))
                        : String.isNotBlank(previousServicesList);

            invoiceRecord = new Accounting_Invoices_Expenses__c(
                Invoice_Date__c    = invoiceDate,
                Invoice_No__c      = (String)salesEntry.get('InvoiceNo'),
                Status__c          = (String)salesEntry.get('Status'),
                //Company__c         = (String)salesEntry.get('company'),
                 Company__c         = companyId,
                Entity_Type__c     = 'Invoice',
                GST__c             = taxAmount,
                Total_Amount__c    = totalAmount,
                Sub_Total__c       = subTotal,
                Due_Date__c        = dueDate,
                Post_Date__c = postDate,
                //Participant__c     = (String)salesEntry.get('participantID') // >>> always set here — this component is always participant context
                // Is_Service_Invoice__c = isServiceInvoice
                // Is_Create_Manage_Invoice__c = !isServiceInvoice
                 Participant__c     = participantId
            );

            if (isValidId) {
                invoiceRecord.Is_Create_Manage_Invoice__c = existingIsCreateManage;
                invoiceRecord.Is_Service_Invoice__c = existingIsServiceInvoice;
            } else {
                invoiceRecord.Is_Create_Manage_Invoice__c = true;
                invoiceRecord.Is_Service_Invoice__c = false;
            }
            Boolean isAdhocInvoice = isValidId ? (existingIsCreateManage == true) : true;
            if (isAdhocInvoice && facilityId != null) {
                invoiceRecord.Facility__c = facilityId;
            }
            System.debug('🟨 isAdhocInvoice: ' + isAdhocInvoice + ' | Facility__c set to: ' + invoiceRecord.Facility__c);
            // if (isServiceInvoice) {
            //     invoiceRecord.Services_Id_List__c = previousServicesList; // final value reconciled below after journal DML
            // } else {
            //     invoiceRecord.Services_Id_List__c = null;
            //     //invoiceRecord.Is_Create_Manage_Invoice__c = true;
            // }
            if (String.isNotBlank(acknowledgedByName)) {
                invoiceRecord.Acknowledged_By__c = acknowledgedByName;
                invoiceRecord.Acknowledged_Date__c = System.now();
            }

            if (isValidId) {
                invoiceRecord.Id = invoiceId;
                update invoiceRecord;
            } else {
                insert invoiceRecord;
                invoiceRecord = [
                    SELECT Id, Name, Total_Amount__c, Invoice_No__c
                    FROM Accounting_Invoices_Expenses__c
                    WHERE Id = :invoiceRecord.Id
                ];
                if (String.isBlank(invoiceRecord.Invoice_No__c)) {
                    String autoName = invoiceRecord.Name;
                    invoiceRecord.Invoice_No__c = (invoiceRecord.Total_Amount__c < 0)
                        ? autoName.replace('INV-', 'CN-')
                        : autoName;
                    update invoiceRecord;
                }
            }

            for (Map<String, Object> entry : salesEntryList) {
                // String taxStr = String.valueOf(entry.get('tax'));
                // Decimal taxValue = !String.isBlank(taxStr) ? Decimal.valueOf(taxStr.replace('%', '')) : 0;
                // Decimal taxMultiplier = 1 + (taxValue / 100);
                // Decimal unitPrice = entry.get('Amount__c') != null ? Decimal.valueOf(String.valueOf(entry.get('Amount__c'))) : 0;
                // Decimal quantity = entry.get('Quantity__c') != null ? Decimal.valueOf(String.valueOf(entry.get('Quantity__c'))) : 0;
                // Boolean taxInclusive = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusive')));
                // Decimal baseTotal = (unitPrice * quantity).setScale(2);

                // Decimal subTotalJE;
                // Decimal taxAmountJE;
                // Decimal totalWithTax;
                // if (taxInclusive) {
                //     subTotalJE = (baseTotal / taxMultiplier).setScale(2);
                //     taxAmountJE = (baseTotal - subTotalJE).setScale(2);
                //     totalWithTax = baseTotal;
                // } else {
                //     subTotalJE = baseTotal;
                //     taxAmountJE = (baseTotal * taxValue / 100).setScale(2);
                //     totalWithTax = (subTotalJE + taxAmountJE).setScale(2);
                // }
               // Decimal taxValue = 0; // always 0
                String taxStr = entry.get('tax') != null ? String.valueOf(entry.get('tax')) : '0%';
                Decimal taxValue = !String.isBlank(taxStr) ? Decimal.valueOf(taxStr.replace('%', '').trim()) : 0;
                //Decimal taxMultiplier = 1;
                Decimal unitPrice = entry.get('Amount__c') != null ? Decimal.valueOf(String.valueOf(entry.get('Amount__c'))) : 0;
                Decimal quantity = entry.get('Quantity__c') != null ? Decimal.valueOf(String.valueOf(entry.get('Quantity__c'))) : 0;
                Decimal baseTotal = (unitPrice * quantity).setScale(2);

                //Decimal subTotalJE = baseTotal;
                // Decimal taxAmountJE = 0;
                //Decimal totalWithTax = baseTotal;
                Decimal subTotalJE = entry.get('subTotal') != null ? Decimal.valueOf(String.valueOf(entry.get('subTotal'))) : baseTotal;
                Decimal taxAmountJE = entry.get('taxAmount') != null ? Decimal.valueOf(String.valueOf(entry.get('taxAmount'))) : 0;
                Decimal totalWithTax = entry.get('totalAmount') != null ? Decimal.valueOf(String.valueOf(entry.get('totalAmount'))) : baseTotal;

                Accounting_Journal_Entry__c journalRecord = new Accounting_Journal_Entry__c();
                journalRecord.Tax_Amount__c = taxAmountJE;
                journalRecord.Total_Amount__c = subTotalJE;
                journalRecord.Sub_Total__c = totalWithTax;
                // journalRecord.Sub_Total__c = subTotalJE;       
                // journalRecord.Total_Amount__c = totalWithTax;
                journalRecord.Description__c = String.valueOf(entry.get('Description__c'));
               // journalRecord.Company__c = (String)salesEntry.get('company');
                //journalRecord.Tax_Inclusive__c = (Boolean)salesEntry.get('taxInclusive');
                journalRecord.Company__c = companyId; // >>> FIXED: reuse validated companyId, not raw cast
                journalRecord.Tax_Inclusive__c = salesEntry.get('taxInclusive') != null
                    ? Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusive')))
                    : false;
                journalRecord.Entry_Type__c = 'Sales';
                journalRecord.Sl_no__c = entry.get('sno') != null ? Decimal.valueOf(String.valueOf(entry.get('sno'))) : null;
                journalRecord.Invoice_Date__c = salesEntry.get('InvoiceDate') != null ? Date.valueOf((String)salesEntry.get('InvoiceDate')) : null;

                //if (isServiceInvoice) {
                    //journalRecord.Line_Items__c = String.valueOf(entry.get('lineItems')); // >>> only for service-backed rows
                    journalRecord.Line_Items__c = entry.get('lineItems') != null ? String.valueOf(entry.get('lineItems')) : null;
                //}

                String entityId = (String)salesEntry.get('entityName');
                journalRecord.Entity_Profile__c = entityId;
                if (entityId != null) {
                    Entity_Profile__c entity = [
                        SELECT Name__c, First_Name__c, Last_Name__c
                        FROM Entity_Profile__c
                        WHERE Id = :entityId
                        LIMIT 1
                    ];
                    if (entity.Name__c != null && entity.Name__c.trim() != '') {
                        journalRecord.Entity_Profile_Name__c = entity.Name__c;
                    } else {
                        String fullName = ((entity.First_Name__c != null) ? entity.First_Name__c : '') +
                            ' ' + ((entity.Last_Name__c != null) ? entity.Last_Name__c : '');
                        journalRecord.Entity_Profile_Name__c = fullName.trim();
                    }
                }

                journalRecord.Invoice_No__c = (String)salesEntry.get('InvoiceNo');
                journalRecord.Comments__c = (String)salesEntry.get('comments');
                journalRecord.Notes__c = (String)salesEntry.get('notes');
                journalRecord.Unit_Price__c = unitPrice;
                journalRecord.Quantity__c = quantity;
                journalRecord.Tax__c = taxValue;
                //journalRecord.Accounting_Ledger_Items__c = String.valueOf(entry.get('accountItemId'));
                Id accountItemId = null;
                if (entry.get('accountItemId') != null) {
                    String accountItemIdStr = String.valueOf(entry.get('accountItemId'));
                    if (String.isNotBlank(accountItemIdStr) && (accountItemIdStr.length() == 15 || accountItemIdStr.length() == 18)) {
                        accountItemId = (Id) accountItemIdStr;
                    }
                }
                journalRecord.Accounting_Ledger_Items__c = accountItemId;

                journalRecord.Accounting_Invoices_Expenses__c = invoiceRecord.Id;

                String journalId = String.valueOf(entry.get('Id'));
                Boolean validJournalId = !String.isBlank(journalId) && (journalId.length() == 15 || journalId.length() == 18);

                if (validJournalId) {
                    journalRecord.Id = journalId;
                    Accounting_Journal_Entry__c existing = existingJournalEntryMap.get(journalId);
                    if (existing != null && existing.Sl_no__c != null && existing.Sl_no__c != journalRecord.Sl_no__c) {
                        journalRecord.Is_Sno_Changed__c = true;
                    }
                    journalEntriesToUpdate.add(journalRecord);
                } else {
                    journalRecord.Row_Unique_ID__c = journalId;
                    journalEntriesToInsert.add(journalRecord);
                }
            }

            if (!journalEntriesToInsert.isEmpty()) {
                insert journalEntriesToInsert;
            }
            if (!journalEntriesToUpdate.isEmpty()) {
                update journalEntriesToUpdate;
            }

            // if (isServiceInvoice) {
            //     Set<String> survivingServiceIds = new Set<String>();
            //     for (Accounting_Journal_Entry__c je : journalEntriesToInsert) {
            //         if (String.isNotBlank(je.Line_Items__c)) survivingServiceIds.add(je.Line_Items__c);
            //     }
            //     for (Accounting_Journal_Entry__c je : journalEntriesToUpdate) {
            //         if (String.isNotBlank(je.Line_Items__c)) survivingServiceIds.add(je.Line_Items__c);
            //     }

            //    // invoiceRecord.Services_Id_List__c = String.join(new List<String>(survivingServiceIds), ',');
            //     update invoiceRecord;

            //     Set<String> previousServiceIds = new Set<String>(previousServicesList.split(','));
            //     previousServiceIds.removeAll(survivingServiceIds);

            //     if (!previousServiceIds.isEmpty()) {
            //         List<Services_and_Support_Plan__c> releasedServices = [
            //             SELECT Id, Status__c
            //             FROM Services_and_Support_Plan__c
            //             WHERE Id IN :previousServiceIds
            //         ];
            //         for (Services_and_Support_Plan__c svc : releasedServices) {
            //             svc.Status__c = 'Pending Invoice'; // >>> confirm real pre-invoice value
            //         }
            //         if (!releasedServices.isEmpty()) {
            //             update releasedServices;
            //         }
            //     }
            // }

        } catch (Exception e) {
            System.debug('❌ Exception in saveUpdateManageInvoice: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }

        return invoiceRecord;
    }
    @AuraEnabled
    public static Xero_or_Myob_Invoice__c createUpdateManualXeroInvoice(
        String salesEntryJson,
        String salesEntryListJson,
        String amountEntryJson,
        Boolean isParticipantInvoice,
        String acknowledgedByName 
    ) {
        Xero_or_Myob_Invoice__c invoiceRecord = new Xero_or_Myob_Invoice__c();
        List<Xero_Invoice_Entries__c> journalEntriesToUpdate = new List<Xero_Invoice_Entries__c>();
        List<Xero_Invoice_Entries__c> journalEntriesToInsert = new List<Xero_Invoice_Entries__c>();

        try {

            System.debug('──────────────────────────────────────────────');
            System.debug('🔵 START createUpdateManualXeroInvoice');
            System.debug('🔵 isParticipantInvoice: ' + isParticipantInvoice);
            System.debug('──────────────────────────────────────────────');

            Map<String, Object> salesEntry = (Map<String, Object>) JSON.deserializeUntyped(salesEntryJson);
            Map<String, Object> amountEntry = (Map<String, Object>) JSON.deserializeUntyped(amountEntryJson);
            Id facilityId = null;
            if (salesEntry.containsKey('facilityId') && salesEntry.get('facilityId') != null) {
                String facilityIdStr = String.valueOf(salesEntry.get('facilityId'));
                if (String.isNotBlank(facilityIdStr) && (facilityIdStr.length() == 15 || facilityIdStr.length() == 18)) {
                    facilityId = (Id) facilityIdStr;
                }
            }
            System.debug('🟨 facilityId extracted: ' + facilityId);
            Id participantId = null;
            if (salesEntry.containsKey('participantID') && salesEntry.get('participantID') != null) {
                String participantIdStr = String.valueOf(salesEntry.get('participantID'));
                if (String.isNotBlank(participantIdStr) && (participantIdStr.length() == 15 || participantIdStr.length() == 18)) {
                    participantId = (Id) participantIdStr;
                }
            }
            System.debug('🟨 participantId extracted: ' + participantId);
            List<Object> rawList = (List<Object>) JSON.deserializeUntyped(salesEntryListJson);

            List<Map<String, Object>> salesEntryList = new List<Map<String, Object>>();
            Set<Id> journalIds = new Set<Id>();

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

            // Build Invoice
            String invoiceId = String.valueOf(salesEntry.get('invoiceId'));
            Boolean isValidId = !String.isBlank(invoiceId) && (invoiceId.length() == 15 || invoiceId.length() == 18);

            System.debug('🟦 Existing InvoiceId: ' + invoiceId + ' | isValidId: ' + isValidId);

            // >>> On edit, read the real origin flags from DB — never derive from
            // the current form state. On insert (manual component), always
            // treat as Is_Create_Manage_Invoice__c.
            Boolean existingIsServiceInvoice = false;
            Boolean existingIsCreateManageInvoice = false;

            if (isValidId) {
                List<Xero_or_Myob_Invoice__c> existingInvoiceList = [
                    SELECT Id, Is_Service_Invoice__c, Is_Create_Manage_Invoice__c
                    FROM Xero_or_Myob_Invoice__c
                    WHERE Id = :invoiceId
                    LIMIT 1
                ];
                if (!existingInvoiceList.isEmpty()) {
                    existingIsServiceInvoice = existingInvoiceList[0].Is_Service_Invoice__c == true;
                    existingIsCreateManageInvoice = existingInvoiceList[0].Is_Create_Manage_Invoice__c == true;
                }
            }

            // isServiceOrigin only matters on EDIT of a record that was originally
            // service-generated. A brand-new record from this method is never
            // service-origin — this method only ever inserts as Manual.
            Boolean isServiceOrigin = isValidId && existingIsServiceInvoice;
            System.debug('🟦 isServiceOrigin: ' + isServiceOrigin);

            Decimal subTotal = Decimal.valueOf(String.valueOf(amountEntry.get('subTotal')));
            Decimal taxAmount = Decimal.valueOf(String.valueOf(amountEntry.get('taxAmount')));
            Decimal totalAmount = Decimal.valueOf(String.valueOf(amountEntry.get('totalAmount')));

            invoiceRecord = new Xero_or_Myob_Invoice__c(
                //Invoice_Date__c    = Date.valueOf((String)salesEntry.get('InvoiceDate')),
                Invoice_Date__c    = salesEntry.get('InvoiceDate') != null
                                        ? Date.valueOf((String)salesEntry.get('InvoiceDate'))
                                        : null,
                //Due_Date__c        = Date.valueOf((String)salesEntry.get('dueDate')),
                Due_Date__c       = salesEntry.get('dueDate') != null    
                                        ? Date.valueOf((String)salesEntry.get('dueDate'))
                                        : null,
                Post_Date__c       = salesEntry.get('PostDate') != null    
                                        ? Date.valueOf((String)salesEntry.get('PostDate'))
                                        : null,
                Invoice_No__c      = (String)salesEntry.get('InvoiceNo'),
                Status__c          = (String)salesEntry.get('Status'),
                GST__c             = taxAmount,
                Total_Amount__c    = totalAmount,
                Sub_Total__c       = subTotal,
                Invoice_Source__c  = 'Xero',
                Comments__c        = (String)salesEntry.get('comments'),   
                Notes__c           = (String)salesEntry.get('notes')  
            );
            Boolean isAdhocInvoice = isValidId ? existingIsCreateManageInvoice : true;
            if (isAdhocInvoice && facilityId != null) {
                invoiceRecord.Facility__c = facilityId;
            }
            System.debug('🟨 isAdhocInvoice: ' + isAdhocInvoice + ' | Facility__c set to: ' + invoiceRecord.Facility__c);

            // Participant applies whenever selected, regardless of origin
            if (isParticipantInvoice == true) {
                invoiceRecord.Participant__c = (String)salesEntry.get('participantID');
            }

            // Services_Id_List__c only relevant if editing a record that was
            // originally service-generated (this method never creates one)
            // if (isServiceOrigin) {
            //     invoiceRecord.Services_Id_List__c = (String)salesEntry.get('ServicesList');
            // }

            // Entity: two different key names depending on caller history — check both
            String entityId = (String) salesEntry.get('entityProfileId');
            if (String.isBlank(entityId) || entityId == 'N/A') {
                entityId = (String) salesEntry.get('entityName');
            }
            if (String.isBlank(entityId) || entityId == 'N/A') {
                entityId = null;
            }
            Boolean isValidEntityId = String.isNotBlank(entityId) && (entityId.length() == 15 || entityId.length() == 18);
            if (isValidEntityId) {
                invoiceRecord.Xero_Entity__c = entityId;
            }
            System.debug('🟦 Linked Entity: ' + (isValidEntityId ? entityId : 'not set'));
            if (String.isNotBlank(acknowledgedByName)) {
                invoiceRecord.Acknowledged_By__c = acknowledgedByName;
                invoiceRecord.Acknowledged_Date__c = System.now();
            }

            // UPDATING or INSERTING the Invoice
            if (isValidId) {
                invoiceRecord.Id = invoiceId;
                update invoiceRecord;
                // Is_Service_Invoice__c / Is_Create_Manage_Invoice__c intentionally
                // never touched here — preserves whatever was stamped at creation
                System.debug('🟩 Updated Invoice: ' + invoiceRecord.Id);
            } else {
                invoiceRecord.Is_Create_Manage_Invoice__c = true;   // always true for a new record via this method
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
                }
            }

            /* ─────────── PROCESS JOURNAL ENTRIES ─────────── */
            for (Map<String, Object> entry : salesEntryList) {
                // String taxStr = entry.get('tax') != null ? String.valueOf(entry.get('tax')).replace('%', '') : '0';
                // Decimal taxValue = String.isNotBlank(taxStr) ? Decimal.valueOf(taxStr) : 0;
                // Decimal taxMultiplier = 1 + (taxValue / 100);
                Decimal taxValue = 0; // always 0
                Decimal taxMultiplier = 1;

                Decimal unitPrice = entry.get('Amount__c') != null
                    ? Decimal.valueOf(String.valueOf(entry.get('Amount__c')))
                    : 0;
                Decimal quantity = entry.get('Quantity__c') != null
                    ? Decimal.valueOf(String.valueOf(entry.get('Quantity__c')))
                    : 0;
                Boolean taxInclusive = Boolean.valueOf(String.valueOf(salesEntry.get('taxInclusive')));

                Decimal baseTotal;
                if (quantity == 0 && unitPrice == 0) {
                    baseTotal = entry.get('totalAmount') != null
                        ? Decimal.valueOf(String.valueOf(entry.get('totalAmount')))
                        : 0;
                } else {
                    baseTotal = (unitPrice * quantity).setScale(2);
                }

                // Decimal subTotalJE;
                // Decimal taxAmountJE;
                // Decimal totalWithTax;

                // if (taxInclusive) {
                //     subTotalJE = (baseTotal / taxMultiplier).setScale(2);
                //     taxAmountJE = (baseTotal - subTotalJE).setScale(2);
                //     totalWithTax = baseTotal;
                // } else {
                //     subTotalJE = baseTotal;
                //     taxAmountJE = (baseTotal * taxValue / 100).setScale(2);
                //     totalWithTax = (subTotalJE + taxAmountJE).setScale(2);
                // }
                Decimal subTotalJE = baseTotal;
                Decimal taxAmountJE = 0;
                Decimal totalWithTax = baseTotal;

                Xero_Invoice_Entries__c journalRecord = new Xero_Invoice_Entries__c();
                journalRecord.Tax_Amount__c = taxAmountJE;
                journalRecord.Total_Amount__c = subTotalJE;
                journalRecord.Sub_Total__c = totalWithTax;
                journalRecord.Description__c = String.valueOf(entry.get('Description__c'));
                //journalRecord.Line_Items__c = String.valueOf(entry.get('lineItems'));
                journalRecord.Line_Items__c = entry.get('lineItems') != null ? String.valueOf(entry.get('lineItems')) : null;
                journalRecord.Tax_Inclusive__c = taxInclusive;
                journalRecord.Sl_no__c = entry.get('sno') != null
                    ? Decimal.valueOf(String.valueOf(entry.get('sno')))
                    : null;
                journalRecord.Invoice_Date__c = salesEntry.get('InvoiceDate') != null
                    ? Date.valueOf((String) salesEntry.get('InvoiceDate'))
                    : null;
                journalRecord.Unit_Price__c = unitPrice;
                journalRecord.Quantity__c = quantity;
                journalRecord.Tax__c = taxValue;
                journalRecord.Xero_or_Myob_Invoice__c = invoiceRecord.Id;

                Object accountItemIdObj = entry.get('accountItemId');
                Object accountListObj = entry.get('accountList');
                journalRecord.Xero_Account_Id__c = (accountItemIdObj != null && String.isNotBlank(String.valueOf(accountItemIdObj)))
                    ? String.valueOf(accountItemIdObj)
                    : null;
                journalRecord.Xero_Account_Label__c = (accountListObj != null && String.isNotBlank(String.valueOf(accountListObj)))
                    ? String.valueOf(accountListObj)
                    : null;

                String journalId = String.valueOf(entry.get('Id'));
                Boolean validJournalId = !String.isBlank(journalId) && (journalId.length() == 15 || journalId.length() == 18);

                if (validJournalId) {
                    journalRecord.Id = journalId;
                    journalEntriesToUpdate.add(journalRecord);
                } else {
                    journalEntriesToInsert.add(journalRecord);
                }
            }

            if (!journalEntriesToInsert.isEmpty()) insert journalEntriesToInsert;
            if (!journalEntriesToUpdate.isEmpty()) update journalEntriesToUpdate;

            /* ─────────── UPDATE SERVICES LIST (only if editing a service-origin record) ─────────── */
            // if (isServiceOrigin) {
            //     String servicesList = (String) salesEntry.get('ServicesList');
            //     if (!String.isBlank(servicesList)) {
            //         List<String> serviceIds = servicesList.split(',');
            //         List<Services_and_Support_Plan__c> updatedServiceList = [
            //             SELECT Id FROM Services_and_Support_Plan__c WHERE Id IN :serviceIds
            //         ];
            //         for (Services_and_Support_Plan__c serv : updatedServiceList) {
            //             serv.Status__c = 'Invoice Generated';
            //             serv.Xero_or_Myob_Invoice__c = invoiceRecord.Id;
            //         }
            //         if (!updatedServiceList.isEmpty()) update updatedServiceList;
            //     }
            // }

        } catch (Exception e) {
            System.debug('❌ ERROR in createUpdateManualXeroInvoice: ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }

        System.debug('🟢 RETURNING Invoice Id: ' + invoiceRecord.Id);
        return invoiceRecord;
    }
    @AuraEnabled
    public static Map<String, Object> getXeroInvoiceHistoryDetails(Id invoiceId) {
        Map<String, Object> result = new Map<String, Object>();

        try {
            // ✅ Invoice Query (safe)
            List<Xero_or_Myob_Invoice__c> invoiceList = [
                SELECT Id, Name, Due_Date__c, Invoice_Date__c, Status__c,
                    GST__c, Total_Amount__c, Sub_Total__c, Invoice_No__c,
                    Acknowledged_By__c, Acknowledged_Date__c,
                    Quantity__c, Unit_Price__c, Description__c, Amazon_URL__c, Email_Count__c,
                    Xero_Entity__c, Xero_Innvoice_Id__c, Participant__c, Services_Id_List__c,
                    Is_Create_Manage_Invoice__c, Is_Service_Invoice__c, Comments__c, Notes__c,
                    CreatedDate, LastModifiedDate
                FROM Xero_or_Myob_Invoice__c
                WHERE Id = :invoiceId
                LIMIT 1
            ];
            if (invoiceList.isEmpty()) {
                throw new AuraHandledException('Invoice not found for ID: ' + invoiceId);
            }
            Xero_or_Myob_Invoice__c invoice = invoiceList[0];
            result.put('invoice', invoice);

            // ✅ Xero_Invoice_Entries__c child records
            List<Xero_Invoice_Entries__c> entries = [
                SELECT Id, Name, Description__c, Unit_Price__c, Tax_Amount__c,
                    Total_Amount__c, Sub_Total__c, Tax_Inclusive__c, Sl_no__c,
                    CreatedDate, LastModifiedDate, Quantity__c, Tax__c,
                    Xero_Account_Id__c, Xero_Account_Label__c, Line_Items__c
                FROM Xero_Invoice_Entries__c
                WHERE Xero_or_Myob_Invoice__c = :invoiceId
            ];
            result.put('entries', entries);
            System.debug('✅ Xero Entries size: ' + entries.size());

            // ✅ Invoice History
            List<Xero_or_Myob_Invoice__History> invoiceHistory = [
                SELECT Id, Field, OldValue, NewValue, CreatedDate, CreatedBy.Name
                FROM Xero_or_Myob_Invoice__History
                WHERE ParentId = :invoiceId
                ORDER BY CreatedDate ASC
            ];
            result.put('invoiceHistory', invoiceHistory);
            System.debug('✅ Xero Invoice History size: ' + invoiceHistory.size());

            // ✅ Entry History only if entries exist
            Set<Id> entryIds = new Set<Id>();
            for (Xero_Invoice_Entries__c entry : entries) {
                entryIds.add(entry.Id);
            }

            List<Xero_Invoice_Entries__History> entryHistory = new List<Xero_Invoice_Entries__History>();
            if (!entryIds.isEmpty()) {
                entryHistory = [
                    SELECT Id, Field, OldValue, NewValue, CreatedDate, CreatedBy.Name, ParentId
                    FROM Xero_Invoice_Entries__History
                    WHERE ParentId IN :entryIds
                    ORDER BY CreatedDate ASC
                ];
            }
            result.put('entryHistory', entryHistory);
            System.debug('✅ Xero Entry History size: ' + entryHistory.size());
            
            Set<Id> entityIdsInHistory = new Set<Id>();
            for (Xero_or_Myob_Invoice__History h : invoiceHistory) {
                if (h.Field == 'Xero_Entity__c') {
                    String oldVal = (String) h.OldValue;
                    String newVal = (String) h.NewValue;

                    if (String.isNotBlank(oldVal) && (oldVal.length() == 15 || oldVal.length() == 18)) {
                        entityIdsInHistory.add((Id) oldVal);
                    }
                    if (String.isNotBlank(newVal) && (newVal.length() == 15 || newVal.length() == 18)) {
                        entityIdsInHistory.add((Id) newVal);
                    }
                }
            }

            Map<Id, String> entityNameMap = new Map<Id, String>();
            if (!entityIdsInHistory.isEmpty()) {
                // >>> Adjust object/field API names below to match your real "Xero Entity" object
                for (Xero_Entity__c xe : [
                    SELECT Id, First_Name__c, Last_Name__c
                    FROM Xero_Entity__c
                    WHERE Id IN :entityIdsInHistory
                ]) {
                    String displayName = (String.isNotBlank(xe.First_Name__c) ? xe.First_Name__c : '') +
                                        ' ' + (String.isNotBlank(xe.Last_Name__c) ? xe.Last_Name__c : '');
                    entityNameMap.put(xe.Id, displayName.trim());
                }
            }
            result.put('entityNameMap', entityNameMap);

        } catch (Exception ex) {
            System.debug('❌ Exception: ' + ex.getMessage());
            throw new AuraHandledException('Error getting Xero invoice history: ' + ex.getMessage());
        }

        return result;
    }
    @AuraEnabled
    public static void deleteMatchingXeroRecords(String deletedIdsJson) {
        System.debug('🔁 Input JSON: ' + deletedIdsJson);

        try {
            List<String> idsToDelete = (List<String>) JSON.deserialize(deletedIdsJson, List<String>.class);
            System.debug('🔍 Deserialized IDs: ' + idsToDelete);

            if (idsToDelete.isEmpty()) {
                System.debug('⚠️ No IDs provided. Exiting method.');
                return;
            }

            List<Xero_Invoice_Entries__c> entriesToDelete = [
                SELECT Id, Xero_or_Myob_Invoice__c, Sl_no__c
                FROM Xero_Invoice_Entries__c
                WHERE Id IN :idsToDelete
                FOR UPDATE
            ];

            System.debug('📌 Xero entries found for deletion: ' + entriesToDelete.size());
            for (Xero_Invoice_Entries__c entry : entriesToDelete) {
                System.debug('🗑️ To Delete: ' + entry.Id + ' | Invoice: ' + entry.Xero_or_Myob_Invoice__c + ' | Sl_no: ' + entry.Sl_no__c);
            }

            if (!entriesToDelete.isEmpty()) {
                Database.delete(entriesToDelete, false);
                System.debug('✅ Delete operation completed');
            } else {
                System.debug('ℹ️ No matching records found to delete.');
            }

        } catch (Exception ex) {
            System.debug('❗ Error in deleteMatchingXeroRecords: ' + ex.getMessage());
            throw new AuraHandledException('Error deleting matching Xero records: ' + ex.getMessage());
        }
    }

    
}