/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 05-23-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class AWSServiceFileService {
    public string awsKey {get;set;}
    public string awsSecret {get;set;}
    public string bucketName {get;set;}
    public string methodName {get;set;}
    public string hostName {get;set;}
    
    public AWSServiceFileService(string key, string secret, string bucket, string method, string host)
    {
        awsKey=key;
        awsSecret=secret;
        bucketName=bucket;
        methodName=method;
        hostName=host;
    }
    
    public string ContentType(string fileType)
    {
        switch on fileType.toLowerCase()
        {
            when 'docx'
            {
                return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            }
            when 'csv'
            {
                return 'application/vnd.ms-excel';
            }
            when 'wav'
            {
                return 'audio/wav';
            }
            when 'wmv'
            {
                return 'video/x-ms-wmv';
            }
            when 'mp3'
            {
                return 'audio/mpeg';
            }
            when 'mp4'
            {
                return 'video/mp4';
            }
            when 'png'
            {
                return 'image/png';
                
            }
            when 'pdf'
            {
                return 'application/pdf';
                
            }
            when else {
                return 'image/jpeg';
            }
        }
    }
    
    public string CreateAuthHeader(String contentType,
                                   String filename, String formattedDateString,string fileExtension){
                                       
                                       System.debug('content Type '+contentType);
                                       System.debug('filename '+filename);
                                       System.debug('fileExtension '+fileExtension);
                                       System.debug('content Type '+contentType);
                                       string auth;
                                       String stringToSign = this.methodName+'\n\n'+contentType+'\n'+formattedDateString+'\n/'+this.bucketName+'/'+filename.toLowerCase();
                                       Blob mac = Crypto.generateMac('HMACSHA1', blob.valueof(stringToSign),blob.valueof(this.awsSecret));
                                       String sig = EncodingUtil.base64Encode(mac);
                                       auth = 'AWS' + ' ' + this.awsKey + ':' + sig;
                                       return auth;
                                   }
    
    
    public void UploadDocuments(String base64, String filename, String recordId, string obj)
    {        
        System.debug('decode ');
        if(string.isBlank(this.awsSecret) || string.isBlank(this.awsKey) || string.isBlank(this.bucketName) || string.isBlank(this.hostName))
        {
            System.debug('inside ');
            throw new BaseException('Set AWS credential');
        }
        //File Content
        String base64Content = ( String ) JSON.deserialize( base64, String.class );
        Blob attachmentBody = EncodingUtil.base64Decode(base64Content);
        String formattedDateString = Datetime.now().formatGMT('EEE, dd MMM yyyy HH:mm:ss z');
        String filename1 = filename;//attach.Title;
        string[] part = filename.split('\\.');
        String FileExtension ='.'+part[1];
        string contentType=FileExtension;
        system.debug('contentType:'+contentType);
        string fileUrl='https://' + this.bucketName + '.' + this.hostName + '/' + filename1.toLowerCase();
        system.debug('url>>'+fileUrl);
        HttpRequest req = new HttpRequest();
        req.setMethod(this.methodName);
        req.setEndpoint(fileUrl);
        req.setHeader('Host', this.bucketName + '.' + this.hostName);
        req.setHeader('Content-Encoding', 'UTF-8');
        req.setHeader('Content-type', contentType);
        req.setHeader('Connection', 'keep-alive');
        req.setHeader('Date', formattedDateString);
        req.setHeader('ACL', 'public-read');
        req.setBodyAsBlob(attachmentBody);
        
        req.setHeader('Authorization',CreateAuthHeader(contentType, filename1, formattedDateString,contentType));
        
        Http http = new Http();
        HTTPResponse res = http.send(req);
        System.debug('method '+res.getStatusCode());
        if (res.getStatusCode() == 200 || res.getStatusCode()==201) 
        {
            System.debug('method '+recordId);
            if(obj == 'audit'){
                Staff_Payroll_Setting__c pat=new Staff_Payroll_Setting__c(id=recordId);
                pat.Amazon_URL__c=fileUrl;
                update pat;
            }else if(obj == 'invoice'){
                Service_Invoice__c pat= new Service_Invoice__c(id=recordId);
                pat.Amazon_Service_URL__c=fileurl;
                update pat;
            }else if(obj == 'rep'){
                Repository__c pat= new Repository__c(id=recordId);
                pat.Amazon_file_URL__c=fileurl;
                update pat;
            }else if(obj == 'attach'){
                Attachment__c pat= new Attachment__c(id=recordId);
                pat.Amazon_file_URL__C=fileurl;
                update pat;
            }else if(obj == 'agree'){
                Service_Agreement__c pat= new Service_Agreement__c(id=recordId);
                pat.Amazon_Url__c=fileurl;
                update pat;
            }else if(obj == 'expense'){
                Expenses__c pat= new Expenses__c(id=recordId);
                pat.Amazon_URL__c=fileurl;
                update pat;
            }else if(obj == 'staff'){
                Staff__c pat= new Staff__c(id=recordId);
                pat.picture__c=fileurl;
                update pat;
            }else if(obj == 'reimburse'){
                Reimbursement__c pat= new Reimbursement__c(id=recordId);
                system.debug('reimburse id'+recordId);
                system.debug('file Url'+fileurl);
                pat.Amazon_file_URL__c=fileurl;
                update pat;
            }else if(obj == 'invoiceParent'){
                Invoice_Parent__c pat= new Invoice_Parent__c(id=recordId);
                system.debug('reimburse id'+recordId);
                system.debug('file Url'+fileurl);
                pat.Amazon_URL__c=fileurl;
                update pat;
            }else if(obj == 'case'){
                Case pat= new Case(id=recordId);
                pat.Amazon_URL__c=fileurl;
                update pat;
            } else if(obj == 'ChildStaff'){
                Child_Staff__c pat= new Child_Staff__c(id=recordId);
                system.debug('reimburse id'+recordId);
                system.debug('file Url'+fileurl);
                pat.View_File__c=fileurl;
                update pat;
            } else if(obj == 'hrtraining'){
                Training__c pat= new Training__c(id=recordId);
                system.debug('reimburse id'+recordId);
                system.debug('file Url'+fileurl);
                pat.Attachments__c=fileurl;
                update pat;
            } else if(obj == 'facility'){
                Facility__c pat= new Facility__c(id=recordId);
                pat.Picture__c=fileurl;
                update pat;
            } else if(obj == 'client'){
                client__c pat= new client__c(id=recordId);
                pat.Picture__c=fileurl;
                update pat;
            } else if(obj == 'lead'){
                Lead pat= new Lead(id=recordId);
                pat.Amazon_Url__c=fileurl;
                update pat;
            } else if(obj == 'tesseractInvoice'){
                Tesseract_Invoice__c pat= new Tesseract_Invoice__c(id=recordId);
                pat.Amazon_URL__c=fileurl;
                update pat;
            }else if(obj == 'leave'){
                Leave__c pat= new Leave__c(id=recordId);
                pat.Leave_Document__c=fileurl;
                update pat;
            }else if(obj == 'pform'){
                Participant_Form__c pat= new Participant_Form__c(id=recordId);
                pat.Amazon_URL__c=fileurl;
                update pat;
            }else if(obj == 'org'){
                Organisation__c pat= new Organisation__c(id=recordId);
                pat.Logo__c=fileurl;
                update pat;
            } else if(obj == 'activity'){
                BAS_and_IAS__c pat= new BAS_and_IAS__c(id=recordId);
                pat.Amazon_URL__c=fileurl;
                update pat;
            }else if(obj == 'Award'){
                Award__c pat= new Award__c(id=recordId);
                pat.Certificate__c=fileurl;
                update pat;
            }else if(obj == 'RFQ'){
                RFQ__c pat= new RFQ__c(id=recordId);
                pat.Amazon_Url__c=fileurl;
                update pat;
            }else if(obj == 'offerLetter'){
                Offer_Template__c pat= new Offer_Template__c(id=recordId);
                pat.Amazon_Url__c=fileurl;
                update pat;
            }/*else if(obj == 'ocrUrl'){
                Document_Data__c pat= new Document_Data__c(id=recordId);
                pat.Uploaded_File_URL__c=fileurl;
                update pat;
            } */else if(obj == 'signUrl'){
             Child_Signatures__c cs= new Child_Signatures__c();
                cs.Offer_Template__c=recordId;
                cs.Signature_URL__c=fileurl;
                insert cs;
            }else if(obj == 'RiskRecords'){
             Risk_Management__c cs= new Risk_Management__c(id=recordId);
                cs.Amazon_URL__c=recordId;
                cs.Amazon_URL__c=fileurl;
                update cs;
            }else if(obj == 'AccountingInvoice'){
             Accounting_Invoices_Expenses__c cs= new Accounting_Invoices_Expenses__c(id=recordId);
                cs.Amazon_URL__c=recordId;
                cs.Amazon_URL__c=fileurl;
                update cs;
            }else if(obj == 'Attachment'){
             Ticket__c pat= new Ticket__c(id=recordId);
                pat.Attachment__c=fileurl;
                update pat;
            }else if(obj == 'Post Attachment'){
             Ticket__c pat= new Ticket__c(id=recordId);
                pat.Post_Attachment__c=fileurl;
                update pat;
            }else if(obj == 'ParticipantTemplate'){
             Participant_Template__c pat= new Participant_Template__c(id=recordId);
                pat.AWS_Document__c=fileurl;
                update pat;
            }
            
        }
       
    }
}