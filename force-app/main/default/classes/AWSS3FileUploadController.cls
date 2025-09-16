/**
 * @description       : 
 * @author            : Raja Sekhar Reddy
 * @group             : 
 * @last modified on  : 05-23-2023
 * @last modified by  : Raja Sekhar Reddy
**/
public with sharing class AWSS3FileUploadController {
    @AuraEnabled
    public static void uploadFile(String base64, String filename, String recordId,string obj)
    {
        UploadDocument(base64,filename,recordId,obj);
        
    }
    
    @future(callout=true)
    public static void UploadDocument(String base64, String filename, String recordId,string obj)
    {
        //S3 Key 
        String key = System.Label.AWSKey; 
        System.debug('value of key '+(key==System.Label.AWSKey));
        //S3 Secret Key 
        System.debug('value of AWSSecret '+System.Label.AWSSecret);
        System.debug('value of AWSBucket '+System.Label.AWSBucket);
        String secret = System.Label.AWSSecret;
        String bucket = System.Label.AWSBucket;
        String host = System.Label.AWSHost;
        String method = System.Label.AWSMethod;
        AWSServiceFileService service=new AWSServiceFileService(key,secret,bucket,method,host);
        service.UploadDocuments(base64,filename,recordId,obj);
    }
    
    
    
}