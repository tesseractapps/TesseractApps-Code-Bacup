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
        Organisation__c orgDetails=[select Id,Name,ABN__c,ACN__c,Address_Latest__c,Contact_No__c,
                                    NDIS_Provider__c,Organization_Logo__c,Account_Name__c,Account_Number__c,
                                    Bank__c,BSB__c,Description__c,RCTI__c,Address_Latest__Street__s,
                                    Address_Latest__City__s,Address_Latest__StateCode__s,Address_Latest__CountryCode__s,
                                    Address_Latest__PostalCode__s,Roles__c,Type_of_User__c  from Organisation__c where Name=:userDetails.Organization_Name__c];
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
	
  /*  @AuraEnabled
    public static Invoice_Parent__c saveFile(String base64Data, string orgId) {        
        String data = JSON.deserializeUntyped(base64Data).toString();
        Invoice_Parent__c  invparent;
        List<String> lstCSVLines = data.split('\n');
        String facName='';
        for (Integer i = 1; i < lstCSVLines.size(); i++) {
            String csvLine = lstCSVLines[i];
            List<String> csvRowData = new List<String>();
            string descr;
            string dateIssued;
            integer quant;
            Decimal unitpr;
            string includeGST;
            
            for (String column : csvLine.split(',')) {
                column = column.replaceAll(':quotes:', '"').replaceAll(':comma:', ',');
                csvRowData.add(column);
            }            
            System.debug('CSV Row >> ' + csvRowData);            
            if (csvRowData.size() > 1) {                
                dateIssued = csvRowData[0];
                includeGST = csvRowData[1];
                descr = csvRowData[2];
                quant = Integer.ValueOf(csvRowData[3]);
                
                // Convert the unit price to Decimal
            	String cleanedUnitPrice = csvRowData[4].replaceAll('[^0-9.]', '');
            	unitpr = Decimal.valueOf(cleanedUnitPrice);
                //unitpr = Integer.valueOf(csvRowData[4]);
               	String JSONDes = '[{"description":"' + descr + '","quantity":' + quant + ',"unitPrice":' + unitpr + '}]';
                invparent = insertInvoice(JSONDes,orgId,dateIssued,NULL,includeGST,Null,NULL,NULL,NULL,Null,Null,null,null);
                
            } else {
                System.debug('Skipping invalid CSV row: ' + csvRowData);
            }
        }
        return invparent;
    } */
    
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
    
}