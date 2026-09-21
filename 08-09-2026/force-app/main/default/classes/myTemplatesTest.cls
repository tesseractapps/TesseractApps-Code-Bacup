@IsTest
public class myTemplatesTest {
/*
    @testSetup
    static void setupData() {
        
        TestDataFactory.createBaseData();
        
    }*/
@testSetup
static void setupData() {
    List<String> roles = new List<String>{'NDIS Org Admin','Roaster Manager','HR Manager','Support Worker'};

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
        org.Week_Start_Day__c='Monday';
         
        insert org;

    Profile prof = [SELECT Id, Name FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];

    User user = new User(
        Alias = 'praveen',
        Email = 'manualtesting.20294637@hotmail.com',
        EmailEncodingKey = 'UTF-8',
        LastName = 'StaffOne209463',
        LanguageLocaleKey = 'en_US',
        LocaleSidKey = 'en_US',
        ProfileId = prof.Id,
        TimeZoneSidKey = 'America/New_York',
        User_Type__c = 'NDIS Org Admin',
        UserName = 'manualtesting.20294637@hotmail.com',
        Organization_Name__c = 'Ashfield Consultants'
    );
    insert user;

    System.runAs(user) {
        Facility__c fac = new Facility__c();
        fac.Name = 'Ashfield Consultants';
        fac.Address__City__s = 'Crace';
        fac.Address__Street__s = '8 Keewong Street';
        fac.Address__StateCode__s = 'ACT';
        fac.Address__PostalCode__s = '2911';
        fac.Address__CountryCode__s = 'AU';
        fac.Email__c = 'testonefacility@gmail.com';
        fac.Status__c = true;
        fac.Organisation__c = org.Id;
        fac.ABN__c = '12345678901';
        fac.Phone__c = '12323432';
        fac.Type_of_Service__c = 'Ndis';
        insert fac;

        Staff__c staff = new Staff__c();
        staff.Last_Name__c = 'Test staff';
        staff.Name = 'praveen1';
        staff.Name__c = 'abcd';
        staff.Contact_Number__c = '56789908743';
        staff.Email_Address__c = 'manualtesting.20294637@hotmail.com';
        staff.Facility__c = fac.Id;
        staff.Address__Street__s = '8 Keewong Street';
        staff.Address__City__s = 'Crace';
        staff.Address__StateCode__s = 'ACT';
        staff.Address__PostalCode__s = '2911';
        staff.Emergency_Phone_Number__c = '45678766675';
        staff.Primary_Contact_Name__c = 'Praveen';
        staff.Primary_Contact_Number__c = '9908458298';
        staff.Make_Primary_as_Approver__c = true;
        staff.Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com';
        staff.Secondary_Contact_Name__c = 'maheswari';
        staff.Secondary_Contact_Email__c = 'maheswari.adabala@gmail.com';
        staff.Make_Secondary_as_Approver__c = false;
        staff.Secondary_Contact_Number__c = '99084582958';
        staff.Emp_exit_date__c = Date.newInstance(2028, 1, 5);
        staff.Emp_Start_Date__c = Date.newInstance(2023, 2, 1);
        staff.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 2, 4);
        staff.Date_Of_Birth__c = Date.newInstance(2001, 2, 4);
        staff.role__c = 'Admin';
        staff.Residency_Type__c = 'Australian';
        staff.Expiry_Date__c = Date.newInstance(2025, 2, 19);
        staff.Type__c = 'Visa Status';
        staff.Working_Hours_Rate__c = 50;
        staff.Final_Overall_Rate__c = 150;
        staff.Saturday_Hourly_Rate__c = 130;
        staff.Sunday_Hourly_Rate__c = 50;
        staff.Status__c = true;
        staff.Restrict_Set_Hours__c = false;
        staff.Set_Hours__c = 40;
        insert staff;

        StaffRole__c sr = new StaffRole__c(
            StaffRole_To_Staff__c = staff.Id,
            Facility__c = fac.Id,
            RoleName__c = 'Admin',
            Active__c = true,
            Hourly_Rate__c = 50
        );
        insert sr;

        Staff_Facility__c sf = new Staff_Facility__c(
            Staff__c = staff.Id,
            Facility__c = fac.Id,
            Active__c = true
        );
        insert sf;
    }
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

     @IsTest
    static void testSaveTemplateShares() {
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
            Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

            Id templateId = myTemplates.saveTemplateData(
                null, 'Share.pdf', 'https://share.com', '{}',
                org.Id, 'KEYSHARE', 'Share Template', 'Desc', 'Participant', 'Draft'
            );

            Test.startTest();

            // null guards -> early return
            myTemplates.saveTemplateShares(null, new List<Id>{ staff.Id });
            myTemplates.saveTemplateShares(templateId, null);

            // insert branch (no existing shares)
            myTemplates.saveTemplateShares(templateId, new List<Id>{ staff.Id });

            // delete-existing + re-insert branch (second call finds the first share)
            myTemplates.saveTemplateShares(templateId, new List<Id>{ staff.Id });

            Test.stopTest();
        }
    }
}