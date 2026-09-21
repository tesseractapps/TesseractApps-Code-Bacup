@IsTest
public class myTemplatesTest {

    @testSetup
    static void setupData() {
        
        TestDataFactory.createBaseData();
        
    }

    @IsTest
    static void testSaveFetchAndStatus() {
        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            Organisation__c org = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            Test.startTest();

            Id templateId = myTemplates.saveTemplateData(
                null,
                'Agreement.pdf',
                'https://test.com/agreement.pdf',
                '{"Name":"Test"}',
                org.Id,
                'KEY001',
                'Agreement Template',
                'Sample Description',
                'Participant',
                'Draft'
            );

            myTemplates.fetchTemplateData(templateId);

            myTemplates.updateTemplateStatus(templateId, 'ARCHIVE');
            myTemplates.updateTemplateStatus(templateId, 'UNARCHIVE');

            myTemplates.saveTemplateData(
                templateId,
                'Agreement2.pdf',
                'https://test.com/agreement2.pdf',
                '{"Name":"Updated"}',
                org.Id,
                'KEY002',
                'Agreement Template Updated',
                'Updated Description',
                'Participant',
                'Draft'
            );

            myTemplates.getCurrentUserType();

            Test.stopTest();
        }
    }

    @IsTest
    static void testInvalidArchiveAction() {
        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            Organisation__c org = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            Id templateId = myTemplates.saveTemplateData(
                null,
                'Test.pdf',
                'https://abc.com',
                '{}',
                org.Id,
                'KEY100',
                'Template',
                'Desc',
                'Participant',
                'Draft'
            );

            Test.startTest();

            try {
                myTemplates.updateTemplateStatus(templateId, 'TEST');
            } catch (Exception e) {
            }

            Test.stopTest();
        }
    }

    @IsTest
    static void testGetAllTemplatesAndArchiveTemplates() {
        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            Organisation__c org = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            myTemplates.saveTemplateData(
                null,
                'Draft.pdf',
                'https://draft.com',
                '{}',
                org.Id,
                'KEY1',
                'Draft Template',
                'Desc',
                'Participant',
                'Draft'
            );

            myTemplates.saveTemplateData(
                null,
                'Archive.pdf',
                'https://archive.com',
                '{}',
                org.Id,
                'KEY2',
                'Archive Template',
                'Desc',
                'Participant',
                'Archive'
            );

            Test.startTest();

            myTemplates.getAllTemplates(org.Id);
            myTemplates.getArchivedTemplates(org.Id);

            Test.stopTest();
        }
    }

    @IsTest
    static void testGetSavedTemplates() {
        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            Organisation__c org = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            Id templateId = myTemplates.saveTemplateData(
                null,
                'Agreement.pdf',
                'https://test.com/agreement.pdf',
                '{}',
                org.Id,
                'KEY001',
                'Agreement',
                'Description',
                'Participant',
                'Draft'
            );

            Participant_Template__c pt = new Participant_Template__c(
                Template__c = templateId,
                File_Name__c = 'Agreement.pdf',
                AWS_Document__c = 'https://aws.com/doc.pdf',
                Organization__c = org.Id,
                Status__c = 'Created',
                Recipient_JSON__c = '{"FullName":"John Smith","Email":"john@test.com"}'
            );

            insert pt;

            Offer_Template__c offer = new Offer_Template__c(
                Participant_Template__c = pt.Id,
                Current_Recipient_Status__c = 'Completed',
                Current_Recipient__c = 'john@test.com',
                All_Recipients__c = 'john@test.com\nmanager@test.com'
            );

            insert offer;

            Child_Signatures__c sign = new Child_Signatures__c(
                Offer_Template__c = offer.Id,
                Signature_URL__c = 'https://signed.com/doc.pdf'
            );

            TriggerUtility.bypassTrigger = true;
            insert sign;
            TriggerUtility.bypassTrigger = false;

            Test.startTest();

            myTemplates.getSavedTemplates(org.Id);

            Test.stopTest();
        }
    }

    @IsTest
    static void testStorePdfAndCustomConfig() {
        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            Organisation__c org = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            Id templateId = myTemplates.saveTemplateData(
                null,
                'Doc.pdf',
                'https://abc.com/doc.pdf',
                '{}',
                org.Id,
                'KEY10',
                'Template',
                'Desc',
                'Participant',
                'Draft'
            );

            Test.startTest();

            myTemplates.storePdfRecord(
                'https://aws.com/doc.pdf',
                templateId,
                org.Id,
                'Generated.pdf',
                '{"FullName":"John","Email":"john@test.com"}',
                'fingerprint123'
            );

            myTemplates.saveCustomFieldConfig(
                org.Id,
                '{"label":"Field1","type":"Text"}'
            );

            myTemplates.getCustomFieldConfig(org.Id);

            myTemplates.removeCustomFieldConfig(
                org.Id,
                'Field1',
                'Text'
            );

            Test.stopTest();
        }
    }

   
    @IsTest
    static void testGetStaffByFacilities() {
        User u = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            Staff__c staff = [
                SELECT Id, Facility__c
                FROM Staff__c
                LIMIT 1
            ];

            Test.startTest();

            myTemplates.getStaffByFacilities(null);
            myTemplates.getStaffByFacilities(new List<String>());
            myTemplates.getStaffByFacilities(new List<String>{staff.Facility__c});

            Test.stopTest();
        }
    }

    @IsTest
    static void testDeleteTemplate() {
        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            Organisation__c org = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            Id templateId = myTemplates.saveTemplateData(
                null,
                'Del.pdf',
                'https://del.com',
                '{}',
                org.Id,
                'KEYDEL',
                'Del Template',
                'Desc',
                'Participant',
                'Draft'
            );

            Participant_Template__c pt = new Participant_Template__c(
                Template__c = templateId,
                File_Name__c = 'Del.pdf',
                AWS_Document__c = 'https://aws.com/del.pdf',
                Organization__c = org.Id,
                Status__c = 'Created'
            );

            insert pt;

            Test.startTest();

            myTemplates.deleteTemplate(pt.Id);

            Test.stopTest();
        }
    }

    @IsTest
    static void testCustomFieldConfigBranches() {
        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            Organisation__c org = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            Test.startTest();

            myTemplates.removeCustomFieldConfig(org.Id, 'Nothing', 'Text');

            myTemplates.saveCustomFieldConfig(
                org.Id,
                '{"label":"Field1","type":"Text"}'
            );

            myTemplates.saveCustomFieldConfig(
                org.Id,
                '{"label":"Field2","type":"Number"}'
            );

            myTemplates.getCustomFieldConfig(org.Id);

            myTemplates.removeCustomFieldConfig(
                org.Id,
                'Field1',
                'Text'
            );

            Test.stopTest();
        }
    }

    @IsTest
    static void testGetSavedTemplatesBranches() {
        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            Organisation__c org = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            Id t1 = myTemplates.saveTemplateData(
                null,
                'A.pdf',
                'https://a.com',
                '{}',
                org.Id,
                'KA',
                'A',
                'Desc',
                'Participant',
                'Draft'
            );

            Participant_Template__c pt1 = new Participant_Template__c(
                Template__c = t1,
                File_Name__c = 'A.pdf',
                AWS_Document__c = 'https://a.com/doc.pdf',
                Organization__c = org.Id,
                Status__c = 'Created',
                Recipient_JSON__c = 'malformed{json'
            );

            insert pt1;

            Id t2 = myTemplates.saveTemplateData(
                null,
                'B.pdf',
                'https://b.com',
                '{}',
                org.Id,
                'KB',
                'B',
                'Desc',
                'Participant',
                'Draft'
            );

            Participant_Template__c pt2 = new Participant_Template__c(
                Template__c = t2,
                File_Name__c = 'B.pdf',
                AWS_Document__c = 'https://b.com/doc.pdf',
                Organization__c = org.Id,
                Status__c = 'Created',
                Recipient_JSON__c = '{"FullName":"Jane Doe","Email":"jane@test.com"}'
            );

            insert pt2;

            Offer_Template__c offer2 = new Offer_Template__c(
                Participant_Template__c = pt2.Id,
                Current_Recipient__c = 'jane@test.com',
                Current_Recipient_Status__c = null,
                All_Recipients__c = 'jane@test.com\nother@test.com'
            );

            insert offer2;

            Id t3 = myTemplates.saveTemplateData(
                null,
                'C.pdf',
                'https://c.com',
                '{}',
                org.Id,
                'KC',
                'C',
                'Desc',
                'Participant',
                'Draft'
            );

            Participant_Template__c pt3 = new Participant_Template__c(
                Template__c = t3,
                File_Name__c = 'C.pdf',
                AWS_Document__c = 'https://c.com/doc.pdf',
                Organization__c = org.Id,
                Status__c = 'Created',
                Recipient_JSON__c = '{"FullName":"Jane Doe","Email":"jane@test.com"}'
            );

            insert pt3;

            Offer_Template__c offer3 = new Offer_Template__c(
                Participant_Template__c = pt3.Id,
                Current_Recipient__c = 'other@test.com',
                Current_Recipient_Status__c = null,
                All_Recipients__c = 'jane@test.com\nother@test.com'
            );

            insert offer3;

            Test.startTest();

            myTemplates.getSavedTemplates(org.Id);
            myTemplates.getSavedTemplates(null);

            Test.stopTest();
        }
    }

    @IsTest
    static void testSendTemplateEmail() {
        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            Organisation__c org = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            Test.setMock(
                HttpCalloutMock.class,
                new EmailRelayMock()
            );

            Test.startTest();

            try {
                myTemplates.sendTemplateEmail(
                    new List<String>{'recipient@test.com'},
                    new List<String>{'cc@test.com'},
                    'Agreement Template',
                    'https://aws.com/doc.pdf',
                    'John Smith',
                    org.Id
                );
            } catch (Exception e) {
            }

            Test.stopTest();
        }
    }

  
    private class EmailRelayMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"success":true}');
            return res;
        }
    }
    
    @IsTest
    static void testRecipientOptionsAndDetails() {
        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            Organisation__c org = [
                SELECT Id FROM Organisation__c
                WHERE Name = :u.Organization_Name__c LIMIT 1
            ];

            Test.startTest();

            // both SOQL queries execute + null guard
            myTemplates.getParticipantAndContactOptions(null);
            myTemplates.getParticipantAndContactOptions(org.Id);

            // blank guard throw + unknown-email throw (both caught)
            try { myTemplates.getRecipientDetailsByEmail('', org.Id); } catch (Exception e) {}
            try { myTemplates.getRecipientDetailsByEmail('nobody@test.com', org.Id); } catch (Exception e) {}

            // "found" branches only when setup provides matching records
            List<Client__c> clients = [SELECT Id, Email__c FROM Client__c WHERE Email__c != null LIMIT 1];
            if (!clients.isEmpty()) {
                try { myTemplates.getRecipientDetailsByEmail(clients[0].Email__c, org.Id); } catch (Exception e) {}
            }
            List<New_Contact__c> contacts = [SELECT Id, Email__c FROM New_Contact__c WHERE Email__c != null LIMIT 1];
            if (!contacts.isEmpty()) {
                try { myTemplates.getRecipientDetailsByEmail(contacts[0].Email__c, org.Id); } catch (Exception e) {}
            }

            Test.stopTest();
        }
    }

    @IsTest
    static void testRecipientDemographicDetails() {
        User u = [
            SELECT Id FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

            Test.startTest();

            // blank guard
            myTemplates.getRecipientDemographicDetails(null);
            myTemplates.getRecipientDemographicDetails('');

            // valid JSON, missing recipientType/contactId -> early return
            myTemplates.getRecipientDemographicDetails('{"foo":"bar"}');

            // recipientType neither Staff nor Participant -> early return after recordId set
            myTemplates.getRecipientDemographicDetails(
                '{"recipientType":"Other","contactId":"' + staff.Id + '"}'
            );

            // Staff branch (guaranteed data)
            myTemplates.getRecipientDemographicDetails(
                '{"recipientType":"Staff","contactId":"' + staff.Id + '"}'
            );

            // Client__c participant branch (only if setup has it)
            List<Client__c> clients = [SELECT Id FROM Client__c LIMIT 1];
            if (!clients.isEmpty()) {
                myTemplates.getRecipientDemographicDetails(
                    '{"recipientType":"Participant","contactId":"' + clients[0].Id + '"}'
                );
            }

            // New_Contact__c participant branch (only if setup has it)
            List<New_Contact__c> contacts = [SELECT Id FROM New_Contact__c LIMIT 1];
            if (!contacts.isEmpty()) {
                myTemplates.getRecipientDemographicDetails(
                    '{"recipientType":"Participant","contactId":"' + contacts[0].Id + '"}'
                );
            }

            Test.stopTest();
        }
    }

    @IsTest
    static void testGuardBranches() {
        User u = [
            SELECT Id FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u) {
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

            Test.startTest();
            try { myTemplates.fetchTemplateData(null); } catch (Exception e) {}
            try { myTemplates.updateTemplateStatus(null, 'ARCHIVE'); } catch (Exception e) {}
            try { myTemplates.updateTemplateStatus(staff.Id, ''); } catch (Exception e) {}
            Test.stopTest();
        }
    }   
}