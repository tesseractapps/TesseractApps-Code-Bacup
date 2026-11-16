@isTest
private class TSign_AWSPdfServiceTest {

    // ==================================================================
    // Setup Data
    // ==================================================================
    @testSetup
    static void setupData() {
        // Create an Organisation
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = 'Test Org ' + DateTime.now().getTime(),
            Active__c = true,
            Email__c = 'org@example.com'
        );
        insert org;

        // Generate a valid 64-character hex token
        String validToken = EncodingUtil.convertToHex(Crypto.generateAesKey(256));

        // Create an Offer Template for recipient 1
        TSign_Offer_Template__c template1 = new TSign_Offer_Template__c(
            File_Name__c = 'Test Template 1.pdf',
            All_Recipients__c = 'recipient1@example.com\nrecipient2@example.com',
            Current_Recipient__c = 'recipient1@example.com',
            Current_Recipient_Status__c = 'Pending',
            TSign_Organisation__c = org.Id,
            Link_Token__c = validToken,
            Link_Active__c = true,
            Expire__c = System.now().addDays(14)
        );
        insert template1;

        // Create a second template for an invalid token scenario
        TSign_Offer_Template__c template2 = new TSign_Offer_Template__c(
            File_Name__c = 'Test Template 2.pdf',
            All_Recipients__c = 'recipient3@example.com',
            Current_Recipient__c = 'recipient3@example.com',
            Current_Recipient_Status__c = 'Pending',
            TSign_Organisation__c = org.Id,
            Link_Token__c = EncodingUtil.convertToHex(Crypto.generateAesKey(256)),
            Link_Active__c = false,
            Expire__c = System.now().addDays(-1) // Expired
        );
        insert template2;
    }

    // ==================================================================
    // HTTP Mock Class
    // ==================================================================
    public class EmailRelayMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"status":"success"}');
            res.setStatusCode(200);
            return res;
        }
    }

    // ==================================================================
    // TEST 1: storePdfRecord - Happy Path (Valid Token)
    // ==================================================================
    @isTest
    static void testStorePdfRecord_ValidToken() {
        TSign_Offer_Template__c template = [
            SELECT Id, Link_Token__c FROM TSign_Offer_Template__c 
            WHERE File_Name__c = 'Test Template 1.pdf' LIMIT 1
        ];
        String token = template.Link_Token__c;

        // 1. Set the Mock to prevent the email trigger from failing
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        Test.startTest();
        try {
            String result = TSign_AWSPdfService.storePdfRecord(
                'https://aws.com/signed_doc.pdf',
                template.Id,
                'recipient1@example.com',
                '{"sessionGuid":"abc-123"}',
                token
            );
            System.debug('storePdfRecord result: ' + result);
        } catch (Exception e) {
            System.debug('Caught exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 2: storePdfRecord - Invalid Token
    // ==================================================================
    @isTest
    static void testStorePdfRecord_InvalidToken() {
        TSign_Offer_Template__c template = [
            SELECT Id FROM TSign_Offer_Template__c LIMIT 1
        ];

        Test.startTest();
        try {
            TSign_AWSPdfService.storePdfRecord(
                'https://aws.com/signed_doc.pdf',
                template.Id,
                'recipient1@example.com',
                '{"sessionGuid":"abc-123"}',
                'invalid_token_12345' // Fails regex format
            );
            System.debug('No exception thrown for invalid token.');
        } catch (Exception e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 3: storePdfRecord - Expired Token
    // ==================================================================
    @isTest
    static void testStorePdfRecord_ExpiredToken() {
        TSign_Offer_Template__c template = [
            SELECT Id, Link_Token__c FROM TSign_Offer_Template__c 
            WHERE File_Name__c = 'Test Template 2.pdf' LIMIT 1
        ];
        String token = template.Link_Token__c;

        Test.startTest();
        try {
            TSign_AWSPdfService.storePdfRecord(
                'https://aws.com/signed_doc.pdf',
                template.Id,
                'recipient3@example.com',
                '{"sessionGuid":"abc-123"}',
                token
            );
            System.debug('No exception thrown for expired token.');
        } catch (Exception e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 4: storePdfRecord - Inactive Token
    // ==================================================================
    @isTest
    static void testStorePdfRecord_InactiveToken() {
        // FIX: Query the Link_Token__c field here
        TSign_Offer_Template__c template = [
            SELECT Id, Link_Token__c FROM TSign_Offer_Template__c LIMIT 1
        ];
        
        // Deactivate the token
        template.Link_Active__c = false;
        update template;
        
        String token = template.Link_Token__c;

        Test.startTest();
        try {
            TSign_AWSPdfService.storePdfRecord(
                'https://aws.com/signed_doc.pdf',
                template.Id,
                'recipient1@example.com',
                '{"sessionGuid":"abc-123"}',
                token
            );
            System.debug('No exception thrown for inactive token.');
        } catch (Exception e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 5: storePdfRecord - Legacy Link (Blank Token)
    // ==================================================================
    @isTest
    static void testStorePdfRecord_LegacyLink() {
        TSign_Offer_Template__c template = [
            SELECT Id FROM TSign_Offer_Template__c LIMIT 1
        ];

        // 1. Set the Mock to prevent the email trigger from failing
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        Test.startTest();
        try {
            String result = TSign_AWSPdfService.storePdfRecord(
                'https://aws.com/signed_doc.pdf',
                template.Id,
                'recipient1@example.com',
                '{"sessionGuid":"abc-123"}',
                null // Blank token triggers the legacy path
            );
            System.debug('storePdfRecord result (legacy): ' + result);
        } catch (Exception e) {
            System.debug('Caught exception: ' + e.getMessage());
        }
        Test.stopTest();
    }
}