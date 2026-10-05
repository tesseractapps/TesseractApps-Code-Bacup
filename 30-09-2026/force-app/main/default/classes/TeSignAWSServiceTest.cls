@isTest
public class TeSignAWSServiceTest {
    @testsetup Static void testData(){
        TriggerUtility.bypassTrigger = true;
        Offer_Template__c offerTemplate= new Offer_Template__c();
        offerTemplate.Amazon_Url__c='https://docimgupld.s3.ap-southeast-2.amazonaws.com/tesseractoffer-10page.pdf';
        offerTemplate.All_Recipients__c='praveenshesham.sp@gmail.com '+'\n'+'praveenshesham@tesseractapps.com';
        insert offerTemplate;       
        
        Child_Signatures__c cs= new Child_Signatures__c();
        cs.Offer_Template__c=offerTemplate.ID;
        cs.Recipient_Email__c='praveenshesham.sp@gmail.com';
        cs.Signature_URL__c='https://docimgupld.s3.ap-southeast-2.amazonaws.com/tesseractoffer-10page.pdf';
        insert cs; 
        
        Client__c cli =  new Client__c();
        cli.First_Name__c = 'Test';
        cli.Last_Name__c = 'Participant2948';
        cli.Gendar__c = 'Male';
        cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
        cli.Address__Street__s='8 Keewong Street';
        cli.Address__City__s = 'Crace';
        cli.Address__StateCode__s='ACT';
        cli.Address__PostalCode__s='2911';
        cli.Contact_Number__c='4331237651';
        cli.Drivers_Licence__c = '123456789012';
        cli.Primay_Contact_First_Name__c='Jason';
        cli.Primay_Contact_Last_Name__c='Smith';
        cli.Relationship__c='Parent';
        cli.Email__c='manualtesting.4139559@hotmail.com';
        cli.Primary_Contact_Number__c='0433123123';
        // clientList.add(cli);        
        insert cli;
    }
    
    @isTest
    private static void testUploadDocumentsAndAuthHeader() {
        //Child_Signatures__c childL= [SELECT Id from Child_Signatures__c LIMIT 1];
        // Setting up AWS mock data
        String awsKey = 'testAwsKey';
        String awsSecret = 'testAwsSecret';
        String bucketName = 'testBucket';
        String methodName = 'PUT';
        String hostName = 's3.amazonaws.com';
        
        Offer_Template__c offerTemplate= new Offer_Template__c();
        offerTemplate.Amazon_Url__c='https://docimgupld.s3.ap-southeast-2.amazonaws.com/tesseractoffer-10page.pdf';
        insert offerTemplate; 
        
        TeSignAWSService service = new TeSignAWSService(awsKey, awsSecret, bucketName, methodName, hostName);
        
        String base64 = '"JVBERi0xLjMKJbrfrOAKGFydHhyZWYKMTg2NTIKJSVFT0Y="';
        String filename = 'testFile.pdf';
        String recordId = offerTemplate.Id;
        String objectType = 'offerLetter';
        
        // Set Mock Callout
        Test.setMock(HttpCalloutMock.class, new TeSignAWSServiceMock());
        
        Test.startTest();
        String contentType = service.ContentType('pdf');
        String contentType1 = service.ContentType('docx');
        String contentType2 = service.ContentType('csv');
        String contentType3 = service.ContentType('wav');
        String contentType4 = service.ContentType('wmv');
        String contentType5 = service.ContentType('mp3');
        String contentType6 = service.ContentType('mp4');
        String contentType7 = service.ContentType('png');
        String contentType8 = service.ContentType('zip');
        String contentType9 = service.ContentType('jpeg');
        service.UploadDocuments(base64, filename, recordId, objectType);
        // Assert URL is updated
        Offer_Template__c updatedOffer = [SELECT Id,Amazon_Url__c,All_Recipients__c FROM Offer_Template__c WHERE Id = :recordId];
        Child_Signatures__c childs = [SELECT Id,Recipient_Email__c,Signature_URL__c From Child_Signatures__c LIMIT 1];
        
       // System.assertNotEquals(null, updatedOffer.Amazon_Url__c, 'Amazon URL should be updated');
        // Test ContentType method
        
        TeSignAWSUploadController.UploadDocument(base64, filename, recordId, 'OfferTemplate');
        TeSignAWSUploadController.uploadFile(base64, filename, recordId, 'OfferTemplate');       
        Test.stopTest();
    }
    
    private class TeSignAWSServiceMock implements HttpCalloutMock {
        public HTTPResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('{"success": true, "message": "File uploaded successfully"}');
            return res;
        }
    }
}