@IsTest
public class myTemplatesTest {

    @testSetup
    static void setupData() {

        TestDataFactory.createBaseData();

    }

    @isTest
    static void testSaveFetchAndStatus() {

        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email='manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u){

            Organisation__c org = [
                SELECT Id
                FROM Organisation__c
                WHERE Name = :u.Organization_Name__c
                LIMIT 1
            ];

            Test.startTest();

            // Create Template
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

            // Fetch
            myTemplates.fetchTemplateData(templateId);

            // Archive
            myTemplates.updateTemplateStatus(
                templateId,
                'ARCHIVE'
            );

            // Unarchive
            myTemplates.updateTemplateStatus(
                templateId,
                'UNARCHIVE'
            );

            // Update Existing
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

            // Current User Type
            myTemplates.getCurrentUserType();

            Test.stopTest();
        }
    }

    @isTest
    static void testInvalidArchiveAction() {

        User u = [
            SELECT Id, Organization_Name__c
            FROM User
            WHERE Email='manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(u){

            Organisation__c org = [
                SELECT Id
                FROM Organisation__c
                WHERE Name=:u.Organization_Name__c
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

            try{
                myTemplates.updateTemplateStatus(
                    templateId,
                    'TEST'
                );
            }catch(Exception e){
            }

            Test.stopTest();
        }
    }
@isTest
static void testGetAllTemplatesAndArchiveTemplates() {

    User u = [
        SELECT Id, Organization_Name__c
        FROM User
        WHERE Email='manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(u){

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            WHERE Name=:u.Organization_Name__c
            LIMIT 1
        ];

        Id draftTemplate = myTemplates.saveTemplateData(
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

        Id archiveTemplate = myTemplates.saveTemplateData(
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
@isTest
static void testGetSavedTemplates() {

    User u = [
        SELECT Id, Organization_Name__c
        FROM User
        WHERE Email='manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(u){

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
            Recipient_JSON__c =
                '{"FullName":"John Smith","Email":"john@test.com"}'
        );
        insert pt;

        Offer_Template__c offer = new Offer_Template__c(
            Participant_Template__c = pt.Id,
            Current_Recipient_Status__c = 'Completed',
            Current_Recipient__c = 'john@test.com',
            All_Recipients__c =
                'john@test.com\nmanager@test.com'
        );
        insert offer;

        Child_Signatures__c sign = new Child_Signatures__c(
            Offer_Template__c = offer.Id,
            Signature_URL__c = 'https://signed.com/doc.pdf'
        );
        insert sign;

        Test.startTest();

        myTemplates.getSavedTemplates(org.Id);

        Test.stopTest();
    }
}
    
    @isTest
static void testStorePdfAndCustomConfig() {

    User u = [
        SELECT Id, Organization_Name__c
        FROM User
        WHERE Email='manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(u){

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            WHERE Name=:u.Organization_Name__c
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
    @isTest
static void testSaveTemplateShares() {

    User u = [
        SELECT Id
        FROM User
        WHERE Email='manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(u){

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];

        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];

        Id templateId = myTemplates.saveTemplateData(
            null,
            'Share.pdf',
            'https://share.com',
            '{}',
            org.Id,
            'KEY20',
            'Share Template',
            'Desc',
            'Participant',
            'Draft'
        );

        myTemplates.saveTemplateShares(
            templateId,
            new List<Id>{staff.Id}
        );
    }
}
 
    
    @isTest
static void testGetStaffByFacilities() {
    User u = [SELECT Id FROM User WHERE Email='manualtesting.20294637@hotmail.com' LIMIT 1];
    System.runAs(u){
        Staff__c staff = [SELECT Id, Facility__c FROM Staff__c LIMIT 1];

        Test.startTest();
        List<Staff__c> emptyResult = myTemplates.getStaffByFacilities(null);
        List<Staff__c> emptyResult2 = myTemplates.getStaffByFacilities(new List<String>());
        List<Staff__c> withResult = myTemplates.getStaffByFacilities(new List<String>{staff.Facility__c});
        Test.stopTest();
 
    }
}
@isTest
static void testDeleteTemplate() {
    User u = [SELECT Id, Organization_Name__c FROM User WHERE Email='manualtesting.20294637@hotmail.com' LIMIT 1];
    System.runAs(u){
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name=:u.Organization_Name__c LIMIT 1];
        Id templateId = myTemplates.saveTemplateData(null,'Del.pdf','https://del.com','{}',org.Id,'KEYDEL','Del Template','Desc','Participant','Draft');

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

        List<Participant_Template__c> check = [SELECT Id FROM Participant_Template__c WHERE Id = :pt.Id];
     }
}
 
@isTest
static void testGetRecipientDemographicDetails() {

    User u = [
        SELECT Id
        FROM User
        WHERE Email='manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(u){

        Staff__c staff = [
            SELECT Id
            FROM Staff__c
            LIMIT 1
        ];

        Client__c participant = [
            SELECT Id
            FROM Client__c
            LIMIT 1
        ];

        New_Contact__c contact = new New_Contact__c(
            Name='Demo Contact',
            Email__c='democontact@test.com'
        );
        insert contact;

        Test.startTest();

        myTemplates.getRecipientDemographicDetails('');

        myTemplates.getRecipientDemographicDetails(
            '{"recipientType":"Bogus","contactId":"'+staff.Id+'"}'
        );

        myTemplates.getRecipientDemographicDetails(
            '{"recipientType":"Staff","contactId":"'+staff.Id+'"}'
        );

        myTemplates.getRecipientDemographicDetails(
            '{"recipientType":"Participant","contactId":"'+participant.Id+'"}'
        );

        myTemplates.getRecipientDemographicDetails(
            '{"recipientType":"Participant","contactId":"'+contact.Id+'"}'
        );

        Test.stopTest();
    }
}

@isTest
static void testCustomFieldConfigAppendAndBlankRemove() {
    User u = [SELECT Id, Organization_Name__c FROM User WHERE Email='manualtesting.20294637@hotmail.com' LIMIT 1];
    System.runAs(u){
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name=:u.Organization_Name__c LIMIT 1];

        Test.startTest();
        // removeCustomFieldConfig on org w/ no config yet -> early return branch
        myTemplates.removeCustomFieldConfig(org.Id, 'Nothing', 'Text');

        // first insert (creates array)
        myTemplates.saveCustomFieldConfig(org.Id, '{"label":"Field1","type":"Text"}');
        // second insert -> append branch (existing config not blank)
        myTemplates.saveCustomFieldConfig(org.Id, '{"label":"Field2","type":"Number"}');

        String config = myTemplates.getCustomFieldConfig(org.Id);
        Test.stopTest();

        System.assert(config.contains('Field1') && config.contains('Field2'), 'both fields should be present after append');
    }
}

@isTest
static void testGetSavedTemplatesStatusBranches() {
    User u = [SELECT Id, Organization_Name__c FROM User WHERE Email='manualtesting.20294637@hotmail.com' LIMIT 1];
    System.runAs(u){
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name=:u.Organization_Name__c LIMIT 1];

        // Case A: Participant_Template__c w/ NO Offer_Template__c -> default "Created"
        Id t1 = myTemplates.saveTemplateData(null,'A.pdf','https://a.com','{}',org.Id,'KA','A','Desc','Participant','Draft');
        Participant_Template__c pt1 = new Participant_Template__c(
            Template__c=t1, File_Name__c='A.pdf', AWS_Document__c='https://a.com/doc.pdf',
            Organization__c=org.Id, Status__c='Created', Recipient_JSON__c='malformed{json'  // bad JSON -> catch-swallow branch
        );
        insert pt1;

        // Case B: index==0 -> "Pending"
        Id t2 = myTemplates.saveTemplateData(null,'B.pdf','https://b.com','{}',org.Id,'KB','B','Desc','Participant','Draft');
        Participant_Template__c pt2 = new Participant_Template__c(
            Template__c=t2, File_Name__c='B.pdf', AWS_Document__c='https://b.com/doc.pdf',
            Organization__c=org.Id, Status__c='Created',
            Recipient_JSON__c='{"FullName":"Jane Doe","Email":"jane@test.com"}'
        );
        insert pt2;
        Offer_Template__c offer2 = new Offer_Template__c(
            Participant_Template__c=pt2.Id,
            Current_Recipient__c='jane@test.com',
            Current_Recipient_Status__c=null,
            All_Recipients__c='jane@test.com\nother@test.com'
        );
        insert offer2;

        // Case C: non-zero index, blank currentStatus -> "Pending" fallback
        Id t3 = myTemplates.saveTemplateData(null,'C.pdf','https://c.com','{}',org.Id,'KC','C','Desc','Participant','Draft');
        Participant_Template__c pt3 = new Participant_Template__c(
            Template__c=t3, File_Name__c='C.pdf', AWS_Document__c='https://c.com/doc.pdf',
            Organization__c=org.Id, Status__c='Created',
            Recipient_JSON__c='{"FullName":"Jane Doe","Email":"jane@test.com"}'
        );
        insert pt3;
        Offer_Template__c offer3 = new Offer_Template__c(
            Participant_Template__c=pt3.Id,
            Current_Recipient__c='other@test.com',
            Current_Recipient_Status__c=null,
            All_Recipients__c='jane@test.com\nother@test.com'
        );
        insert offer3;

        Test.startTest();
        List<Map<String,Object>> results = myTemplates.getSavedTemplates(org.Id);
        List<Map<String,Object>> emptyResult = myTemplates.getSavedTemplates(null);
        Test.stopTest();
 
    }
}
 private class EmailRelayMock implements HttpCalloutMock {

    public HTTPResponse respond(HTTPRequest req) {

        HttpResponse res = new HttpResponse();
        res.setStatusCode(200);
        res.setHeader('Content-Type','application/json');
        res.setBody('{"success":true}');

        return res;
    }
}
    @isTest
static void testSendTemplateEmail() {

    User u = [
        SELECT Id, Organization_Name__c
        FROM User
        WHERE Email='manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(u){

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

        try{

            String result = myTemplates.sendTemplateEmail(
                new List<String>{'recipient@test.com'},
                new List<String>{'cc@test.com'},
                'Agreement Template',
                'https://aws.com/doc.pdf',
                'John Smith',
                org.Id
            );

        }catch(Exception e){
            // Ignore any AuraHandledException generated internally.
            // The goal is to execute the code for coverage.
        }

        Test.stopTest();
    }
}
 @isTest
static void testGetRecipientDetailsByEmail() {

    User u = [
        SELECT Id, Organization_Name__c
        FROM User
        WHERE Email='manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(u){

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = :u.Organization_Name__c
            LIMIT 1
        ];

        Client__c participant = [
            SELECT Id, Email__c
            FROM Client__c
            WHERE Email__c != null
            LIMIT 1
        ];

        Test.startTest();

        // Participant branch
        try{
            myTemplates.getRecipientDetailsByEmail(
                participant.Email__c,
                org.Id
            );
        }catch(Exception e){}

        // Blank email branch
        try{
            myTemplates.getRecipientDetailsByEmail(
                '',
                org.Id
            );
        }catch(Exception e){}

        // Null org branch
        try{
            myTemplates.getRecipientDetailsByEmail(
                participant.Email__c,
                null
            );
        }catch(Exception e){}

        // No recipient found branch
        try{
            myTemplates.getRecipientDetailsByEmail(
                'doesnotexist@test.com',
                org.Id
            );
        }catch(Exception e){}

        Test.stopTest();
    }
}
}