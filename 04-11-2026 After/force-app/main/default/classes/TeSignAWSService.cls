public without sharing class TeSignAWSService {
public string awsKey {get;set;}
    public string awsSecret {get;set;}
    public string bucketName {get;set;}
    public string methodName {get;set;}
    public string hostName {get;set;}
    
    public TeSignAWSService(string key, string secret, string bucket, string method, string host)
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
            when 'zip' 
            {
    			return 'application/zip';
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
            
            if(obj == 'offerLetter'){
                Offer_Template__c pat= new Offer_Template__c(id=recordId);
                pat.Amazon_Url__c=fileurl;
                update pat;
          
            }else if(obj == 'signUrl'){
             Child_Signatures__c cs= new Child_Signatures__c();
                cs.Offer_Template__c=recordId;
                cs.Signature_URL__c=fileurl;
                insert cs;
            }
            
        }
       
    }
}