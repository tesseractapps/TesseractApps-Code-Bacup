@isTest
public class RecipientEmailSenderTest {

    @testSetup
    static void setupTestData() {
        TriggerUtility.bypassTrigger = true;

        Organisation__c org = new Organisation__c();
        org.Name = 'Ashfield Consultants';
        org.ABN__c = '11234567891';
        org.ACN__c = '878787878';
        org.Contact_No__c = '6132899740';
        org.RCTI__c = 'RCTI1';
        org.Email__c = 'dsfdsfsd@gmail.com';
        org.Bank__c = 'Bank Test';
        org.BSB__c = 'BSB Test';
        org.Account_Name__c = 'Test Account';
        org.Account_Number__c = '1111111111';
        org.Description__c = 'test Desc';
        org.Address_Latest__Street__s = '101';
        org.Address_Latest__City__s = 'Himas Waterhen';
        org.Address_Latest__PostalCode__s = '2060';
        org.Address_Latest__CountryCode__s = 'AU';
        org.Address_Latest__StateCode__s = 'NSW';
        org.NDIS_Provider__c = '12341234565';
        org.BMSI_Identifier__c = 'TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        insert org;

        Offer_Template__c offerTemplate = new Offer_Template__c(
            All_Recipients__c = 'john.doe@example.com\npraveenshesham.sp@gmail.com',
            Current_Recipient__c = 'john.doe@example.com',
            Current_Recipient_Status__c = 'Pending',
            Orgnisation_Id__c = org.Id
        );
        insert offerTemplate;

        Offer_Template__c offerTemplate1 = new Offer_Template__c(
            All_Recipients__c = 'john.doe@example.com\npraveenshesham.sp@gmail.com',
            Current_Recipient_Status__c = 'Pending',
            Orgnisation_Id__c = org.Id
        );
        insert offerTemplate1;

        Child_Signatures__c childSignature = new Child_Signatures__c(
            Offer_Template__c = String.valueOf(offerTemplate.Id),
            Recipient_Email__c = 'praveenshesham.sp@gmail.com',
            Signature_URL__c = 'https://docimgupld.s3.ap-southeast-2'
        );
        insert childSignature;

        Child_Signatures__c childSignature1 = new Child_Signatures__c(
            Offer_Template__c = String.valueOf(offerTemplate1.Id),
            Recipient_Email__c = 'praveenshesham.sp@gmail.com',
            Signature_URL__c = 'https://docimgupld.s3.ap-southeast-2'
        );
        insert childSignature1;
    }

    @isTest
    static void testSendToRecipient() {
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        // FIX: Must query Recipient_Email__c because sendToRecipient reads it
        List<Child_Signatures__c> childSignatures = [
            SELECT Id, Offer_Template__c, Recipient_Email__c
            FROM Child_Signatures__c
            LIMIT 1
        ];

        Test.startTest();
        RecipientEmailSender.sendToRecipient(childSignatures);
        Test.stopTest();
    }

    @isTest
    static void testStartEmailSequence() {
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        Offer_Template__c template = [
            SELECT Id
            FROM Offer_Template__c
            LIMIT 1
        ];
        
        Child_Signatures__c child = [
            SELECT Id, Recipient_Email__c
            FROM Child_Signatures__c
            WHERE Offer_Template__c = :String.valueOf(template.Id)
            LIMIT 1
        ];

        Test.startTest();
        RecipientEmailSender.startEmailSequence(template.Id, child.Id);
        Test.stopTest();
    }

    @isTest
    static void testSendRecordEmail() {
        Test.setMock(HttpCalloutMock.class, new EmailRelayMock());

        Offer_Template__c template = [
            SELECT Id
            FROM Offer_Template__c
            LIMIT 1
        ];
        
        Child_Signatures__c child = [
            SELECT Id, Recipient_Email__c
            FROM Child_Signatures__c
            WHERE Offer_Template__c = :String.valueOf(template.Id)
            LIMIT 1
        ];

        Test.startTest();
        RecipientEmailSender.sendRecordEmail(
            template.Id,
            child.Id,
            'john.doe@example.com',
            'https://example.com'
        );
        Test.stopTest();
    }

    @isTest
    static void testStartEmailSequenceNoRecipients() {
        Offer_Template__c emptyRecipientTemplate = new Offer_Template__c(
            All_Recipients__c = null
        );
        insert emptyRecipientTemplate;

        Test.startTest();
        try {
            RecipientEmailSender.startEmailSequence(emptyRecipientTemplate.Id, null);
        } catch (Exception e) {
            // expected
        }
        Test.stopTest();
    }

    @isTest
    static void testResolveRecipientName() {
        // Test with saved names
        RecipientEmailSender.resolveRecipientName(
            'a@x.com\nb@x.com',
            'Alice\nBob',
            'b@x.com'
        );

        // Test fallback derived from email
        RecipientEmailSender.resolveRecipientName(
            'john.doe@example.com',
            null,
            'john.doe@example.com'
        );

        // NOTE: Do not pass NULL for the email parameter if you cannot modify 
        // the Apex class, as it will throw a NullPointerException at email.substringBefore('@')
    }

    public class EmailRelayMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('{"success":true}');
            return res;
        }
    }
}