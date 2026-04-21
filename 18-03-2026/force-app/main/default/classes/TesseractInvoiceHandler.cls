public class TesseractInvoiceHandler {
    @AuraEnabled
    public static List<Tesseract_Child_Invoice__c> listofInvoices(String invParentId){
        String invoiceId;
        String invoiceTax;
        return [select Description__c,Billing_Per_User__c,No_of_Users__c,Amount__c,Tesseract_Invoice__c ,Tesseract_Invoice__r.Date_Issued__c,Amazon_URL__c,Tesseract_Invoice__r.Staff__r.Invoice_To__c,Tesseract_Invoice__r.Include_GST__c,Tesseract_Invoice__r.Status__c,Tesseract_Invoice__r.Due_Date__c,
                Tesseract_Invoice__r.Total_GST__c,Tesseract_Invoice__r.Total_Amount__c,Tesseract_Invoice__r.Total__c,Tesseract_Invoice__r.Name,Tesseract_Invoice__r.Plan_Start_Date__c,Tesseract_Invoice__r.Plan_End_Date__c,Tesseract_Invoice__r.Amazon_URL__c,Tesseract_Invoice__r.File_Reference__c,Tesseract_Invoice__r.Organisation_Name__c from Tesseract_Child_Invoice__c 
                where Tesseract_Invoice__c=:invParentId Order by createddate desc];
    }

    @AuraEnabled
    public static List<Tesseract_Invoice__c> listofInvoicesParent(String sDate,String eDate){
        system.debug('Start Date '+sDate);
        system.debug('End Date '+eDate);
              
        Date startDate=Date.valueOf(sDate);
        Date endDate=Date.valueOf(eDate);
         List<Tesseract_Invoice__c> invList= new List<Tesseract_Invoice__c>();        
        invList= [select id,Name,Date_Issued__c,Plan_Start_Date__c,Plan_End_Date__c,Total_GST__c,Total_Amount__c,Organisation_Name__c,Total__c,Amazon_URL__c,Staff__r.Invoice_To__c,File_Reference__c,
                  Status__c,(SELECT ID,Description__c FROM Tesseract_Child_Invoices__r) from Tesseract_Invoice__c where Date_Issued__c >=: startDate and Date_Issued__c <=: endDate
                 Order by createddate desc];
        system.debug(' if Invoice List'+invList);        
        return invList;
    }
    
    @AuraEnabled
    public static Tesseract_Invoice__c insertInvoice(String JsonString,String dateIssue, String includeGst,String invoiceTo,
                                                  string dueDate,string invoiceStatus,string fileref, string invName ){
        system.debug(JsonString);
        System.debug('include gst> '+ includeGst);
        System.debug('due date> '+ dueDate);
        String invoiceId;
        String invoiceTax;
        list<Tesseract_Invoice__c> existInvlist=[select id from Tesseract_Invoice__c where Name=:invName];
       	Tesseract_Invoice__c invParent = new Tesseract_Invoice__c();
        if(existInvlist.size()>0){
            invParent.id=existInvlist[0].id;                                             
         }                                        
       	invParent.Organisation_Name__c=invoiceTo;
        invParent.Date_Issued__c=Date.valueOf(dateIssue);
                                                      
         if(dueDate != null && !String.isBlank(dueDate) ){
         invParent.Due_Date__c=Date.valueOf(dueDate);   
        }
         if(invoiceStatus != null){
         invParent.Status__c=invoiceStatus;   
        }
        if(fileref != null){
         invParent.File_Reference__c=fileref;   
        }
         
    
        invParent.Include_GST__c= includeGst;
        invParent.Organisation_Name__c = invoiceTo;
        if(existInvlist.size()>0){
           update invParent;
         }else{
           insert invParent;  
        }

        if(invParent.Id!=null){
            List<invoiceWrapper> invoiceList = (List<invoiceWrapper>)System.JSON.deserialize(JsonString,List<invoiceWrapper>.class);
             list<Tesseract_Child_Invoice__c> existChildInvlist=[select id,Description__c,Billing_Per_User__c,No_of_Users__c,Tesseract_Invoice__c,Include_GST__c from Tesseract_Child_Invoice__c where Tesseract_Invoice__c=:invParent.Id];
            if(existChildInvlist.size()>0){
            	delete existChildInvlist;
            }
        	List<Tesseract_Child_Invoice__c> invList=new List<Tesseract_Child_Invoice__c>();
            system.debug('invoiceList'+invoiceList);        
            for(invoiceWrapper invRecord:invoiceList){
                if(invRecord.description !=''){
                Tesseract_Child_Invoice__c invRec= new Tesseract_Child_Invoice__c();
                invRec.Description__c=invRecord.description;
               // invRec.Rate__c=Decimal.valueOf(invRecord.rate);
                invRec.No_of_Users__c=Decimal.valueOf(invRecord.quantity);
                    System.debug('No of Users >>'+invRec.No_of_Users__c);
                invRec.Billing_Per_User__c=Decimal.valueOf(invRecord.unitPrice);
                    System.debug('Billing per Users >>'+invRec.Billing_Per_User__c);
                invRec.Tesseract_Invoice__c=invParent.Id;
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
        public String quantity;
        public String unitPrice;        
    }
    
    @AuraEnabled
    public static Tesseract_Invoice__c updateInvoice(string invID,string statusVal,string typeOfUpdate){
      Tesseract_Invoice__c invRec=[select id,Status__c from Tesseract_Invoice__c where id=:invID];
        if(typeOfUpdate=='Status'){
            if(statusVal=='Payment Received'){
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
            List<Facility__c> facRecords = [SELECT Id, Key_Words__c,Tesseract_Email_Keywords__c	 FROM Facility__c where id=:facID LIMIT 1];
            system.debug('key words '+facRecords[0].Tesseract_Email_Keywords__c	);
            if (!facRecords.isEmpty()) {
              fac = facRecords[0];
                 if (String.isBlank(fac.Tesseract_Email_Keywords__c	)) {
                    fac.Tesseract_Email_Keywords__c	 = emailKey;
                } else {
                    fac.Tesseract_Email_Keywords__c	 += ' ' + emailKey;
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
        List<Staff__c> staffData = [SELECT id,Facility__c,Facility__r.Key_Words__c ,Facility__r.Tesseract_Email_Keywords__c	 FROM Staff__c WHERE Email_Address__c = :userEmail LIMIT 1];
        if (!staffData.isEmpty()) {
                return staffData[0].Facility__r.Tesseract_Email_Keywords__c	;

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
    public static list<Tesseract_Invoice__History> getInvoiceParentHistory(string parentID){
        return [SELECT Id,parent.name, Field,  NewValue, OldValue,parent.LastModifiedDate,parent.createddate,parent.createdby.name,parent.lastmodifiedbyid,parent.LastModifiedBy.Name FROM Tesseract_Invoice__History
                where parent.id=:parentID order by createddate desc];
    }
}