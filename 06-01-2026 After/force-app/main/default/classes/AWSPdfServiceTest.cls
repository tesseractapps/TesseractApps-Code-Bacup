@isTest
public class AWSPdfServiceTest {
     private class AWSPDFServiceMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest request) {
            HttpResponse response = new HttpResponse();
            response.setStatusCode(200);
            response.setBody('{"pdfUrl": "https://tesseractapps.com/files/test-pdf.pdf"}');
            response.setHeader('Content-Type', 'application/json');
            return response;
        }
    }

    @testSetup
    static void setupTestData() {
        // Create parent record for testing
        Offer_Template__c parentRecord= new Offer_Template__c();
        parentRecord.Amazon_Url__c='https://docimgupld.s3.ap-southeast-2.amazonaws.com/tesseractoffer-10page.pdf';
        parentRecord.All_Recipients__c='praveenshesham.sp@gmail.com '+'\n'+'praveenshesham@tesseractapps.com';
        insert parentRecord;
    }
    
    
    @isTest
    static void testStorePdfRecord() {
        // Create a Parent Record (Assuming Offer_Template__c is the parent object)
        Offer_Template__c parentRecord = new Offer_Template__c(Comments__c = 'Test Offer',All_Recipients__c = 'test1@example.com');
        insert parentRecord;
        
        // Define test inputs
        String testPdfUrl = 'https://example.com/test.pdf';
        String testRecipientEmail = 'test@example.com';
        
        Test.startTest();
        String returnedUrl = AWSPdfService.storePdfRecord(testPdfUrl, parentRecord.Id, testRecipientEmail);
        Test.stopTest();
        
        // Fetch the created Child_Signatures__c record
        Child_Signatures__c createdRecord = [SELECT Id, Signature_URL__c, Offer_Template__c, Recipient_Email__c 
                                             FROM Child_Signatures__c 
                                             WHERE Offer_Template__c = :parentRecord.Id 
                                             LIMIT 1];

        // Assertions
        //System.assertEquals(testPdfUrl, returnedUrl, 'Returned URL should match input PDF URL');
        //System.assertEquals(testPdfUrl, createdRecord.Signature_URL__c, 'Stored Signature URL should match');
        //System.assertEquals(testRecipientEmail, createdRecord.Recipient_Email__c, 'Recipient Email should be stored correctly');
        System.assertEquals(parentRecord.Id, createdRecord.Offer_Template__c, 'Parent Record ID should match');
    }

    

   
}