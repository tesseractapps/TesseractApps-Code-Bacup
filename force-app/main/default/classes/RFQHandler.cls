public class RFQHandler {
     @AuraEnabled
    public static RFQ__c insertRFQ(String JsonString,String OrgId,String dateIssue, String includeGst, String rfqTo,
                                                  string dueDate,string fileref,string rfqName,string status){
       system.debug(JsonString);
      list<RFQ__c> existRnvList=[select id from RFQ__c where Name=:rfqName];
           RFQ__c rfq = new RFQ__c();
         if(existRnvList.size()>0){
            rfq.id=existRnvList[0].id;                                             
            } 
        rfq.Organization__c=OrgId;
        rfq.Date_Issued__c=Date.valueOf(dateIssue);
        if(dueDate != null && !String.isBlank(dueDate) ){
            rfq.Due_Date__c=Date.valueOf(dueDate); 
        }
        if(fileref != null){
            rfq.File_Reference__c=fileref;   
        }
         rfq.Include_GST__c= includeGst;
         rfq.RFQ_To__c = rfqTo;
         rfq.Status__c= status;                                           
         if(existRnvList.size()>0){
            update rfq;
         }else{
             insert rfq;  
         }
                                                              
     
    
       if(rfq.Id!=null){
            List<invoiceWrapper> invoiceList = (List<invoiceWrapper>)System.JSON.deserialize(JsonString,List<invoiceWrapper>.class);
             list<RFQ_Child__c> existChildRfQList=[select id,Description__c,Quantity__c,RFQ__c,Include_GST__c from RFQ_Child__c where RFQ__c=:rfq.Id];
            if(existChildRfQList.size()>0){
            	delete existChildRfQList;
            }
        	List<RFQ_Child__c> childRFQList=new List<RFQ_Child__c>();
            system.debug('invoiceList'+invoiceList);        
            for(invoiceWrapper invRecord:invoiceList){
                if(invRecord.description !=''){
                RFQ_Child__c rfqRecord= new RFQ_Child__c();
                rfqRecord.Description__c=invRecord.description;
                rfqRecord.Quantity__c=Decimal.valueOf(invRecord.quantity);
                rfqRecord.Unit_Price__c=Decimal.valueOf(invRecord.unitPrice);
                rfqRecord.RFQ__c=rfq.Id;
                rfqRecord.Include_GST__c = includeGst;
                childRFQList.add(rfqRecord);
                }
            }
            if(childRFQList.size()>0){
                    insert childRFQList;
                }
        }
        return rfq;
    }
 
    public class invoiceWrapper{
        public String description;  
        public String quantity;
        public String unitPrice;        
    }
    
   @AuraEnabled(cacheable = true)
    public static list<RFQ__c> getAllRFQData(string sDate,string eDate,string orgId){
        system.debug('orgID rfq'+orgId);
         system.debug('startDate rfq '+sDate);
         system.debug('endDate rfq '+eDate);
        
       	Date startDate=Date.valueOf(sDate);
        Date endDate=Date.valueOf(eDate);
         
        list<RFQ__c> rfqList =[select id,Name,Amazon_Url__c,Due_Date__c,File_Reference__c,Include_GST__c,RFQ_To__c,Total__c,Total_GST__c,Date_Issued__c,Organization__c,Total_Amount__c,Status__c from RFQ__c where Date_Issued__c >=:startDate and Date_Issued__c <=: endDate
                	and Organization__c=: orgId Order by createddate desc];
        system.debug('rfqList '+rfqList );
        return rfqList;
    }
    @AuraEnabled
        public static list<RFQ_Child__c> getAllRFQchildData(string parentId){
            list<RFQ_Child__c> childRFQList=[select id,Description__c,GST__c,Quantity__c,Unit_Price__c,Amount__c,RFQ__r.Name,RFQ__r.Include_GST__c,RFQ__r.Total__c,RFQ__r.Total_GST__c,RFQ__r.Total_Amount__c,RFQ__r.RFQ_To__c,RFQ__r.Date_Issued__c,RFQ__r.Amazon_Url__c,RFQ__r.File_Reference__c,RFQ__r.Due_Date__c,RFQ__r.Status__c from RFQ_Child__c where RFQ__c =:parentId ];
            return childRFQList;
            
        }
     @AuraEnabled
    public static list<RFQ__History> getRFQHistory(string parentID){
        return [SELECT Id,parent.name, Field,  NewValue, OldValue,parent.LastModifiedDate,parent.createddate,parent.createdby.name,parent.lastmodifiedbyid,parent.LastModifiedBy.Name FROM RFQ__History
                where parent.id=:parentID order by createddate desc];
    }
      @AuraEnabled
    public static string updateRFQ(string parentID){
        RFQ__c rf= new RFQ__c();
        rf.id=parentID;
       	rf.Email_Sent__c=true;
        update rf;
        return 'updated';
        
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
	        
		semail.setSubject('RFQ');
		semail.setPlainTextBody('Hi,\n\nPlease find the attached RFQ.\n\nThis is a computer-generated RFQ and no reply is required.\n\nThanks & Regards,\nAdministrator\n' + orgName);
		Messaging.sendEmail(new Messaging.SingleEmailMessage[] {semail});
    }
}