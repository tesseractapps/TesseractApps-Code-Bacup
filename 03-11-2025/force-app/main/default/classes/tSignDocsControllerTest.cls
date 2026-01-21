@isTest
public class tSignDocsControllerTest {     
     @testsetup 
    static void testGetDocumentRecords() {
       // Bypass trigger to avoid DML exceptions if available
        TriggerUtility.bypassTrigger = true;
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='dsfdsfsd@gmail.com';
        org.Bank__c='Bank Test';
        org.BSB__c='BSB Test';
        org.Account_Name__c='Test Account';
        org.Account_Number__c='1111111111';
        org.Description__c='test Desc';
        org.Address_Latest__Street__s='101';
        org.Address_Latest__City__s='Himas Waterhen';
        org.Address_Latest__PostalCode__s='2060';
        org.Address_Latest__CountryCode__s='AU';
        org.Address_Latest__StateCode__s='NSW';
        org.NDIS_Provider__c='12341234565';
        org.BMSI_Identifier__c ='TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        insert org;   
        
        Organisation__c org1 = new Organisation__c();
        org1.Name='Ashfield Consultants';
        org1.ABN__c='11234567891';
        org1.ACN__c='878787878';
        org1.Contact_No__c='6132899740';
        org1.RCTI__c='RCTI1';
        org1.Email__c='dsfdsfsd@gmail.com';
        org1.Bank__c='Bank Test';
        org1.BSB__c='BSB Test';
        org1.Account_Name__c='Test Account';
        org1.Account_Number__c='1111111111';
        org1.Description__c='test Desc';
        org1.Address_Latest__Street__s='101';
        org1.Address_Latest__City__s='Himas Waterhen';
        org1.Address_Latest__PostalCode__s='2060';
        org1.Address_Latest__CountryCode__s='AU';
        org1.Address_Latest__StateCode__s='NSW';
        org1.NDIS_Provider__c='12341234565';
        org1.BMSI_Identifier__c ='TEST BMSI';
        org1.SoftwareId__c = 'jhdfn18328';
        org1.Branch_code__c = 'BS123';
        org1.Contact_Name__c = 'Test Contact';
        org1.User_Type__c = 'NDIS Org Admin';
        insert org1;   
        List<Offer_Template__c> offerList = new List<Offer_Template__c>();
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562e232@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562e232@hotmail.com',Organization_Name__c ='Ashfield Consultants');
        insert user;
        
        
        
            // Create test Offer_Template__c records
            Offer_Template__c offer1 = new Offer_Template__c(
                File_Name__c = 'Offer1.pdf',
                All_Recipients__c = 'Recipient1\nRecipient2',
                Current_Recipient_Status__c = 'Completed',
                Orgnisation_Id__c = org.Id,
                Comments__c = 'Test',
                Type__c = 'Default'
            );
            insert offer1;
    
            Offer_Template__c offer2 = new Offer_Template__c(
                File_Name__c = 'Offer2.pdf',
                All_Recipients__c = 'Recipient3\nRecipient4',
                Current_Recipient_Status__c = 'Pending',
                Comments__c = 'Test',
                 Orgnisation_Id__c = org1.Id
            );
            insert offer2;
            
            Participant_Template__c part = new Participant_Template__c();
            part.Document_Name__c = 'Test Doc';
            part.Document_Type__c = 'Demographic Details';
            insert part;            
    
            Test.startTest();
    
            // Insert child signatures associated with each offer template
            Child_Signatures__c signature1 = new Child_Signatures__c(
                Offer_Template__c = offer1.Id,
                Signature_URL__c = 'https://example.com/signature1.pdf'
            );
            insert signature1;
    
            Child_Signatures__c signature2 = new Child_Signatures__c(
                Offer_Template__c = offer1.Id,
                Signature_URL__c = 'https://example.com/signature2.pdf'
            );
            insert signature2;
    
            Child_Signatures__c signature3 = new Child_Signatures__c(
                Offer_Template__c = offer2.Id,
                Signature_URL__c = 'https://example.com/signature3.pdf'
            );
            insert signature3;
           List<Map<String, Object>> documentRecords = tSignDocsController.getDocumentRecords(org.Id);
            
             for (Map<String, Object> rec : documentRecords) {
                    if ((String)rec.get('Id') == offer1.Id) {
    
                    }
                    if ((String)rec.get('Id') == offer2.Id) {
    
                    }
             } 
            
            Test.stopTest();
        
    }

    @isTest
    static void testFetchPDF() {
        // Mock HttpResponse for the PDF fetch
        Test.startTest();
        HttpResponse response = new HttpResponse();
        response.setStatusCode(200);
        response.setBody('Test PDF content');
        response.setHeader('Content-Type', 'application/pdf');
        
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://example.com/test.pdf');
        req.setMethod('GET');

        // Set mock response
        Test.setMock(HttpCalloutMock.class, new HttpCalloutMockImpl(response));

        String pdfBase64 = tSignDocsController.fetchPDF('https://example.com/test.pdf');
        String pdfBase64s = tSignDocsController.fetchPDF('');
        Test.stopTest();
    }

    @isTest
    static void testUpdateComments() {
        
        // Step 1: Create a test Offer_Template__c record
        Offer_Template__c offer = new Offer_Template__c(
            File_Name__c = 'TestOffer.pdf',
            All_Recipients__c = 'Recipient1\nRecipient2',
            Current_Recipient_Status__c = 'Completed',
            Comments__c = null // Start with no comments
        );
        insert offer;

        // Step 2: Prepare valid and null comments
        String comment1 = '{"author": "Recipient1", "comment": "This is the first test comment."}';
        String comment2 = '{"author": "Recipient2", "comment": "Second comment added."}';
        String emptyComment = null;

        // Step 3: Execute the method under test
        Test.startTest();
        tSignDocsController.updateComments(offer.Id, comment1);
        tSignDocsController.updateComments(offer.Id, comment2);
       // tSignDocsController.updateComments(offer.Id, emptyComment); // should be handled gracefully
        Test.stopTest();

        // Step 4: Retrieve the updated record
        Offer_Template__c updatedOffer = [SELECT Comments__c FROM Offer_Template__c WHERE Id = :offer.Id];

        // Step 5: Assert the comment was updated
        System.assertNotEquals(null, updatedOffer.Comments__c, 'Comments__c should not be null');

        // Optional: Deserialize to verify structure
        List<Object> comments = (List<Object>) JSON.deserializeUntyped(updatedOffer.Comments__c);
        System.assertEquals(2, comments.size(), 'There should be exactly 2 comments saved');

        Map<String, Object> firstComment = (Map<String, Object>)comments[0];
        System.assertEquals('Recipient1', firstComment.get('author'));
        System.assertEquals('This is the first test comment.', firstComment.get('comment'));
    }

    @isTest
    static void testGetComments() {
        // Create test Offer_Template__c record
        Offer_Template__c offer = new Offer_Template__c(
            File_Name__c = 'Offer1.pdf',
            All_Recipients__c = 'Recipient1\nRecipient2',
            Current_Recipient_Status__c = 'Completed',
            Comments__c = 'Test'
            
        );
        insert offer;

        String initialComment = '{"author": "Recipient1", "comment": "Initial comment."}';
        offer.Comments__c = initialComment;
        update offer;

        Test.startTest();
        String comments = tSignDocsController.getComments(offer.Id, 'cacheBuster');
        Test.stopTest();
    }
    @isTest
    static void testFlattenCommentsWithNestedLists() {
        // Sample nested list for testing
        List<Object> nestedComments = new List<Object>{
            'Comment 1',
            new List<Object>{
                'Comment 2',
                new List<Object>{
                    'Comment 3', 'Comment 4'
                },
                'Comment 5'
            },
            'Comment 6'
        };

        Test.startTest();
        List<Object> flattenedComments = tSignDocsController.flattenComments(nestedComments);
        Test.stopTest();
    }
    
    // Mock HttpCalloutMock class for testing HTTP callouts
    private class HttpCalloutMockImpl implements HttpCalloutMock {
        private HttpResponse response;
        
        public HttpCalloutMockImpl(HttpResponse response) {
            this.response = response;
        }
        
        public HTTPResponse respond(HTTPRequest req) {
            return response;
        }
    }
    @isTest
    static void testgetTemplates() {
        User u1= [SELECT Id from User where email='manualtesting.4139562e232@hotmail.com' LIMIT 1];
         System.runAs(u1){ 
            Organisation__c org = [SELECT Id,Name from Organisation__c where name='Ashfield Consultants' limit 1];
            // Insert test data first
            Participant_Template__c part = new Participant_Template__c(
                Document_Name__c = 'Initial Doc',
                Document_Type__c = 'Demographic Details'
            );
            insert part;
        
            Test.startTest();
        
            // Test getTemplates()
            List<Participant_Template__c> listPart = tSignDocsController.getTemplates(org.ID);
         //   System.assertNotEquals(0, listPart.size(), 'Templates list should not be empty');
        
            // Test createTemplate()
            Id newTemplateId = tSignDocsController.createTemplate('Test Doc', 'Demographic Details', org.Id);
            System.assertNotEquals(null, newTemplateId, 'Template Id should not be null');
        
            // Test updateTemplate()
            tSignDocsController.updateTemplate(part.Id, 'Updated Doc', 'Demographic Details', 'https://example.com/test.pdf');
        
            // Optionally test deleteTemplate()
            tSignDocsController.deleteTemplate(part.Id);
        
            Test.stopTest();
         }
    }

}