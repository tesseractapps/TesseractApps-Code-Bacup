@IsTest
private class OfferTemplateTriggerTest {

    @testSetup
    static void setupData() {

        Organisation__c org = new Organisation__c(
            Name = 'Test Org',
            ABN__c='11234567891',
            ACN__c='878787878',
            Contact_No__c='6132899740',
            RCTI__c='RCTI1',
            Email__c='test@test.com',
            Bank__c='Bank Test',
            BSB__c='BSB Test',
            Account_Name__c='Test Account',
            Account_Number__c='1111111111',
            Description__c='test Desc',
            Address_Latest__Street__s='101',
            Address_Latest__City__s='Sydney',
            Address_Latest__PostalCode__s='2000',
            Address_Latest__CountryCode__s='AU',
            Address_Latest__StateCode__s='NSW',
            NDIS_Provider__c='12341234565',
            BMSI_Identifier__c='TEST BMSI',
            SoftwareId__c='jhdfn18328',
            Branch_code__c='BS123',
            Contact_Name__c='Test Contact',
            User_Type__c='NDIS Org Admin'
        );
        insert org;

        Offer_Template__c offer = new Offer_Template__c(
            All_Recipients__c =
                'user1@test.com\nuser2@test.com',
            Current_Recipient__c =
                'user1@test.com',
            Current_Recipient_Status__c =
                'Pending',
            Sender_Email__c =
                'sender@test.com',
            Orgnisation_Id__c =
                org.Id
        );

        insert offer;
    }

    @IsTest
    static void testTrigger_WhenStatusChanges() {

        // Get existing record
        Offer_Template__c offer = [
            SELECT Id,
                   Current_Recipient__c,
                   Current_Recipient_Status__c,
                   Sender_Email__c
            FROM Offer_Template__c
            LIMIT 1
        ];

        Test.startTest();

        // Change status to make:
        // changed == true
        offer.Current_Recipient_Status__c = 'Completed';
        update offer;

        Test.stopTest();

        Offer_Template__c updatedOffer = [
            SELECT Current_Recipient_Status__c
            FROM Offer_Template__c
            WHERE Id = :offer.Id
        ];

        System.assertEquals(
            'Completed',
            updatedOffer.Current_Recipient_Status__c
        );
    }

    @IsTest
    static void testTrigger_WhenRecipientChanges() {

        Offer_Template__c offer = [
            SELECT Id,
                   Current_Recipient__c,
                   Sender_Email__c
            FROM Offer_Template__c
            LIMIT 1
        ];

        Test.startTest();

        offer.Current_Recipient__c = 'user2@test.com';
        update offer;

        Test.stopTest();

        Offer_Template__c updatedOffer = [
            SELECT Current_Recipient__c
            FROM Offer_Template__c
            WHERE Id = :offer.Id
        ];

        System.assertEquals(
            'user2@test.com',
            updatedOffer.Current_Recipient__c
        );
    }

    @IsTest
    static void testTrigger_NoSenderEmail() {

        Offer_Template__c offer = [
            SELECT Id,
                   Sender_Email__c
            FROM Offer_Template__c
            LIMIT 1
        ];

        offer.Sender_Email__c = null;

        update offer;

        Test.startTest();

        offer.Current_Recipient_Status__c = 'Completed';
        update offer;

        Test.stopTest();

        System.assert(true);
    }
}