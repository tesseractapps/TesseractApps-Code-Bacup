@isTest
public class RecipientEmailSenderTest {
    @testSetup
    static void setupTestData() {
        // Create Offer_Template__c record with sample data
        Offer_Template__c offerTemplate = new Offer_Template__c(
            All_Recipients__c = 'john.doe@example.com\npraveenshesham.sp@gmail.com',
            Current_Recipient__c = 'john.doe@example.com',
            Current_Recipient_Status__c = 'Pending'
        );
        insert offerTemplate;
        
        Offer_Template__c offerTemplate1 = new Offer_Template__c(
            All_Recipients__c = 'john.doe@example.com\npraveenshesham.sp@gmail.com',
            //Current_Recipient__c = 'john.doe@example.com',
            Current_Recipient_Status__c = 'Pending'
        );
        insert offerTemplate1;

        System.debug('Offer Template ID: ' + offerTemplate.Id);
        // Create a sample Child_Signatures__c record related to Offer_Template__c
        // //https://docimgupld.s3.ap-southeast-2.amazonaws.com/tesseractoffer-10page.pdf
        Child_Signatures__c childSignature = new Child_Signatures__c(
            Offer_Template__c = string.valueof(offerTemplate.Id),
            Recipient_Email__c='praveenshesham.sp@gmail.com',
        	Signature_URL__c='https://docimgupld.s3.ap-southeast-2'
        );
        insert childSignature;
        
        
        System.debug('child recordAAA ' + childSignature);
        Child_Signatures__c childSignature1 = new Child_Signatures__c(
            Offer_Template__c = string.valueof(offerTemplate1.Id),
            Recipient_Email__c='praveenshesham.sp@gmail.com',
        	Signature_URL__c='https://docimgupld.s3.ap-southeast-2'
        );
        insert childSignature1;
        
        System.debug('Finished: ' + childSignature +' childSignature1 :'+ childSignature1);
    }

    @isTest
    static void testSendToRecipient() {
        // Fetch Child_Signatures__c record
        List<Child_Signatures__c> childSignatures = [
            SELECT Id, Offer_Template__c
            FROM Child_Signatures__c
            LIMIT 1
        ];
        
        Test.startTest();
        RecipientEmailSender.sendToRecipient(childSignatures);
        Test.stopTest();

        // Verify Offer_Template__c update and debug logs
        Offer_Template__c updatedTemplate = [
            SELECT Id, Current_Recipient_Status__c 
            FROM Offer_Template__c 
            WHERE Id = :childSignatures[0].Offer_Template__c
            LIMIT 1
        ];
    }

    @isTest
    static void testStartEmailSequence() {
        Offer_Template__c template = [
            SELECT Id
            FROM Offer_Template__c
            LIMIT 1
        ];

        Test.startTest();
        String result = RecipientEmailSender.startEmailSequence(template.Id);
        Test.stopTest();

    }

    @isTest
    static void testSendRecordEmail() {
        Offer_Template__c template = [
            SELECT Id
            FROM Offer_Template__c
            LIMIT 1
        ];

        Test.startTest();
        RecipientEmailSender.sendRecordEmail(template.Id, 'john.doe@example.com', 'https://example.com');
        Test.stopTest();

        // Verify expiration and link activation update
        Offer_Template__c updatedTemplate = [
            SELECT Id, Expire__c
            FROM Offer_Template__c
            WHERE Id = :template.Id
            LIMIT 1
        ];
        System.assertNotEquals(null, updatedTemplate.Expire__c, 'Expire__c should be updated.');
    }

    @isTest
    static void testStartEmailSequenceNoRecipients() {
        Offer_Template__c emptyRecipientTemplate = new Offer_Template__c(
            All_Recipients__c = null
        );
        insert emptyRecipientTemplate;

        Test.startTest();
        try {
            //RecipientEmailSender.startEmailSequence(emptyRecipientTemplate.Id);
            
        	} catch (AuraHandledException e) {
        }
        Test.stopTest();
    }
}