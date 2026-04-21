public without sharing class TeSignAWSUploadController {
@AuraEnabled
    public static void uploadFile(String base64, String filename, String recordId,string obj)
    {
        UploadDocument(base64,filename,recordId,obj);
        
    }
    
    @future(callout=true)
    public static void UploadDocument(String base64, String filename, String recordId,string obj)
    {
        //S3 Key 
        String key = System.Label.TeSignAWSKey; 
        String secret = System.Label.TeSignAWSSecret;
        String bucket = System.Label.TeSignS3Bucket;
        String host = System.Label.AWSHost;
        String method = System.Label.AWSMethod;
        TeSignAWSService service=new TeSignAWSService(key,secret,bucket,method,host);
        service.UploadDocuments(base64,filename,recordId,obj);
    }
    
    
    
}