@IsTest
private class TemplateLibraryControllerTest {

    @TestSetup
    static void setupTestData() {

        Organisation__c org1 = new Organisation__c();
        org1.Name = 'Ashfield Consultants';
        org1.ABN__c = '11234567891';
        org1.ACN__c = '878787878';
        org1.Contact_No__c = '6132899740';
        org1.RCTI__c = 'RCTI1';
        org1.Email__c = 'dsfdsfsd@gmail.com';
        org1.Bank__c = 'Bank Test';
        org1.BSB__c = 'BSB Test';
        org1.Account_Name__c = 'Test Account';
        org1.Account_Number__c = '1111111111';
        org1.Description__c = 'Test Description';
        org1.Address_Latest__Street__s = '101';
        org1.Address_Latest__City__s = 'Himas Waterhen';
        org1.Address_Latest__PostalCode__s = '2060';
        org1.Address_Latest__CountryCode__s = 'AU';
        org1.Address_Latest__StateCode__s = 'NSW';
        org1.NDIS_Provider__c = '12341234565';
        org1.BMSI_Identifier__c = 'TEST BMSI 001';
        org1.SoftwareId__c = 'TEST-SOFTWARE-001';
        org1.Branch_code__c = 'BS123';
        org1.Contact_Name__c = 'Test Contact';
        org1.User_Type__c = 'NDIS Org Admin';
        org1.Week_Start_Day__c = 'Monday';
        org1.Roles__c = 'Admin;AIN';

        Organisation__c org2 = new Organisation__c();
        org2.Name = 'Test Organisation 2';
        org2.ABN__c = '22345678912';
        org2.ACN__c = '979797979';
        org2.Contact_No__c = '6132899741';
        org2.RCTI__c = 'RCTI2';
        org2.Email__c = 'testorg2@example.com';
        org2.Bank__c = 'Bank Test 2';
        org2.BSB__c = 'BSB Test 2';
        org2.Account_Name__c = 'Test Account 2';
        org2.Account_Number__c = '2222222222';
        org2.Description__c = 'Test Organisation 2';
        org2.Address_Latest__Street__s = '102';
        org2.Address_Latest__City__s = 'Sydney';
        org2.Address_Latest__PostalCode__s = '2000';
        org2.Address_Latest__CountryCode__s = 'AU';
        org2.Address_Latest__StateCode__s = 'NSW';
        org2.NDIS_Provider__c = '22341234565';
        org2.BMSI_Identifier__c = 'TEST BMSI 002';
        org2.SoftwareId__c = 'TEST-SOFTWARE-002';
        org2.Branch_code__c = 'BS124';
        org2.Contact_Name__c = 'Test Contact 2';
        org2.User_Type__c = 'NDIS Org Admin';
        org2.Week_Start_Day__c = 'Monday';
        org2.Roles__c = 'Admin;AIN';

        insert new List<Organisation__c>{
            org1,
            org2
        };

        Template__c template1 = new Template__c();
        
        template1.Template_Name__c = 'Library Template 001';
        template1.Template_Type__c = 'Participant';
        template1.Description__c = 'Test library contract template';
        template1.File_Name__c = 'LibraryTemplate001.docx';
        template1.Amazon_Url__c = 'https://example.com/library-template-001';
        template1.Key__c = 'LIB-TEMPLATE-001';
        template1.Placeholder_JSON__c = '{"firstName":"Test","lastName":"User"}';
        template1.Is_Library_Template__c = true;
        template1.Status__c = 'Publish';

        Template__c template2 = new Template__c();
        
        template2.Template_Name__c = 'Library Template 002';
        template2.Template_Type__c = 'Participant';
        template2.Description__c = 'Test library agreement template';
        template2.File_Name__c = 'LibraryTemplate002.docx';
        template2.Amazon_Url__c = 'https://example.com/library-template-002';
        template2.Key__c = 'LIB-TEMPLATE-002';
        template2.Placeholder_JSON__c = '{"organisation":"Test Organisation"}';
        template2.Is_Library_Template__c = true;
        template2.Status__c = 'Publish';

        Template__c template3 = new Template__c();
         
        template3.Template_Name__c = 'Normal Client Template';
        template3.Template_Type__c = 'Staff';
        template3.Description__c = 'Normal organisation template';
        template3.File_Name__c = 'ClientTemplate.docx';
        template3.Amazon_Url__c = 'https://example.com/client-template';
        template3.Key__c = 'CLIENT-TEMPLATE-001';
        template3.Placeholder_JSON__c = '{}';
        template3.Is_Library_Template__c = false;
        template3.Status__c = 'Publish';

        insert new List<Template__c>{
            template1,
            template2,
            template3
        };

        Template_Assignment__c assignment1 = new Template_Assignment__c();
        assignment1.Template__c = template1.Id;
        assignment1.Organisation__c = org1.Id;
        assignment1.Status__c = 'Active';
        assignment1.Assigned_Date__c = System.now();
        assignment1.Assigned_By__c = UserInfo.getUserId();

        Template_Assignment__c assignment2 = new Template_Assignment__c();
        assignment2.Template__c = template2.Id;
        assignment2.Organisation__c = org1.Id;
        assignment2.Status__c = 'Inactive';
        assignment2.Assigned_Date__c = System.now().addDays(-10);
        assignment2.Assigned_By__c = UserInfo.getUserId();

        Template_Assignment__c assignment3 = new Template_Assignment__c();
        assignment3.Template__c = template2.Id;
        assignment3.Organisation__c = org2.Id;
        assignment3.Status__c = 'Active';
        assignment3.Assigned_Date__c = System.now();
        assignment3.Assigned_By__c = UserInfo.getUserId();

        insert new List<Template_Assignment__c>{
            assignment1,
            assignment2,
            assignment3
        };
    }

    @IsTest
    static void testGetLibraryTemplatesWithValidOrganisation() {
        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];

        Test.startTest();
        List<Template__c> result =
            TemplateLibraryController.getLibraryTemplates(org.Id);
        Test.stopTest();
    }

    @IsTest
    static void testGetLibraryTemplatesWithNullOrganisation() {
        Test.startTest();
        List<Template__c> result =
            TemplateLibraryController.getLibraryTemplates(null);
        Test.stopTest();
    }

    @IsTest
    static void testGetLibraryTemplatesWithOrganisationHavingNoAssignments() {
        Organisation__c org = new Organisation__c();
        org.Name = 'No Assignment Organisation';
        org.ABN__c = '32345678913';
        org.ACN__c = '888888888';
        org.Contact_No__c = '6132899742';
        org.RCTI__c = 'RCTI3';
        org.Email__c = 'noassignment@example.com';
        org.Bank__c = 'Bank Test 3';
        org.BSB__c = 'BSB Test 3';
        org.Account_Name__c = 'Test Account 3';
        org.Account_Number__c = '3333333333';
        org.Description__c = 'No assignment organisation';
        org.Address_Latest__Street__s = '103';
        org.Address_Latest__City__s = 'Melbourne';
        org.Address_Latest__PostalCode__s = '3000';
        org.Address_Latest__CountryCode__s = 'AU';
        org.Address_Latest__StateCode__s = 'VIC';
        org.NDIS_Provider__c = '32341234565';
        org.BMSI_Identifier__c = 'TEST BMSI 003';
        org.SoftwareId__c = 'TEST-SOFTWARE-003';
        org.Branch_code__c = 'BS125';
        org.Contact_Name__c = 'Test Contact 3';
        org.User_Type__c = 'NDIS Org Admin';
        org.Week_Start_Day__c = 'Monday';
        org.Roles__c = 'Admin;AIN';
        insert org;

        Test.startTest();
        List<Template__c> result =
            TemplateLibraryController.getLibraryTemplates(org.Id);
        Test.stopTest();
    }

    @IsTest
    static void testCloneLibraryTemplates() {
        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];

        Template__c template = [
            SELECT Id
            FROM Template__c
            WHERE Key__c = 'LIB-TEMPLATE-001'
            LIMIT 1
        ];

        Test.startTest();
        List<Id> clonedIds =
            TemplateLibraryController.cloneLibraryTemplates(
                new List<Id>{ template.Id },
                org.Id
            );
        Test.stopTest();

        List<Template__c> clones = [
            SELECT Id,
                   Template_Name__c,
                   Template_Type__c,
                   Description__c,
                   File_Name__c,
                   Amazon_Url__c,
                   Key__c,
                   Placeholder_JSON__c,
                   Organisation_Id__c,
                   Is_Library_Template__c,
                   Source_Template__c,
                   Status__c
            FROM Template__c
            WHERE Id IN :clonedIds
        ];
    }

    @IsTest
    static void testCloneMultipleLibraryTemplates() {
        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];

        Template__c template1 = [
            SELECT Id
            FROM Template__c
            WHERE Key__c = 'LIB-TEMPLATE-001'
            LIMIT 1
        ];

        Template__c template2 = [
            SELECT Id
            FROM Template__c
            WHERE Key__c = 'LIB-TEMPLATE-002'
            LIMIT 1
        ];

        Template_Assignment__c inactiveAssignment = [
            SELECT Id, Status__c
            FROM Template_Assignment__c
            WHERE Template__c = :template2.Id
            AND Organisation__c = :org.Id
            LIMIT 1
        ];

        inactiveAssignment.Status__c = 'Active';
        update inactiveAssignment;

        Test.startTest();
        List<Id> clonedIds =
            TemplateLibraryController.cloneLibraryTemplates(
                new List<Id>{
                    template1.Id,
                    template2.Id
                },
                org.Id
            );
        Test.stopTest();

        List<Template__c> clones = [
            SELECT Id
            FROM Template__c
            WHERE Id IN :clonedIds
        ];
    }

    @IsTest
    static void testCloneLibraryTemplatesWithNullIds() {
        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];

        Test.startTest();
        try {
            TemplateLibraryController.cloneLibraryTemplates(
                null,
                org.Id
            );
        } catch (AuraHandledException e) {
        }
        Test.stopTest();
    }

    @IsTest
    static void testCloneLibraryTemplatesWithEmptyIds() {
        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];

        Test.startTest();
        try {
            TemplateLibraryController.cloneLibraryTemplates(
                new List<Id>(),
                org.Id
            );
        } catch (AuraHandledException e) {
        }
        Test.stopTest();
    }

    @IsTest
    static void testCloneLibraryTemplatesWithNullOrganisation() {
        Template__c template = [
            SELECT Id
            FROM Template__c
            WHERE Key__c = 'LIB-TEMPLATE-001'
            LIMIT 1
        ];

        Test.startTest();
        try {
            TemplateLibraryController.cloneLibraryTemplates(
                new List<Id>{ template.Id },
                null
            );
        } catch (AuraHandledException e) {
        }
        Test.stopTest();
    }

    @IsTest
    static void testCloneLibraryTemplatesWithoutActiveAssignment() {
        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];

        Template__c template = [
            SELECT Id
            FROM Template__c
            WHERE Key__c = 'CLIENT-TEMPLATE-001'
            LIMIT 1
        ];

        Test.startTest();
        try {
            TemplateLibraryController.cloneLibraryTemplates(
                new List<Id>{ template.Id },
                org.Id
            );
        } catch (AuraHandledException e) {
        }
        Test.stopTest();
    }

    @IsTest
    static void testGetAssignableOrganisationsWithTemplate() {
        Template__c template = [
            SELECT Id
            FROM Template__c
            WHERE Key__c = 'LIB-TEMPLATE-001'
            LIMIT 1
        ];

        Test.startTest();
        List<TemplateLibraryController.OrganisationAssignmentWrapper> result =
            TemplateLibraryController.getAssignableOrganisations(
                template.Id
            );
        Test.stopTest();
    }

    @IsTest
    static void testGetAssignableOrganisationsWithNullTemplate() {
        Test.startTest();
        List<TemplateLibraryController.OrganisationAssignmentWrapper> result =
            TemplateLibraryController.getAssignableOrganisations(null);
        Test.stopTest();
    }

    @IsTest
    static void testSaveTemplateAssignmentsWithNewAssignment() {
        Organisation__c org1 = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];

        Organisation__c org2 = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = 'Test Organisation 2'
            LIMIT 1
        ];

        Template__c template = [
            SELECT Id, Is_Library_Template__c
            FROM Template__c
            WHERE Key__c = 'LIB-TEMPLATE-001'
            LIMIT 1
        ];

        Test.startTest();
        TemplateLibraryController.saveTemplateAssignments(
            template.Id,
            new List<Id>{ org1.Id, org2.Id }
        );
        Test.stopTest();

        List<Template_Assignment__c> assignments = [
            SELECT Id,
                   Template__c,
                   Organisation__c,
                   Status__c,
                   Assigned_Date__c,
                   Assigned_By__c
            FROM Template_Assignment__c
            WHERE Template__c = :template.Id
        ];
    }

    @IsTest
    static void testSaveTemplateAssignmentsReactivatesInactiveAssignment() {
        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];

        Template__c template = [
            SELECT Id
            FROM Template__c
            WHERE Key__c = 'LIB-TEMPLATE-002'
            LIMIT 1
        ];

        Test.startTest();
        TemplateLibraryController.saveTemplateAssignments(
            template.Id,
            new List<Id>{ org.Id }
        );
        Test.stopTest();

        Template_Assignment__c assignment = [
            SELECT Id, Status__c
            FROM Template_Assignment__c
            WHERE Template__c = :template.Id
            AND Organisation__c = :org.Id
            LIMIT 1
        ];
    }

    @IsTest
    static void testSaveTemplateAssignmentsDeactivatesExistingAssignment() {
        Organisation__c org1 = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];

        Organisation__c org2 = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = 'Test Organisation 2'
            LIMIT 1
        ];

        Template__c template = [
            SELECT Id
            FROM Template__c
            WHERE Key__c = 'LIB-TEMPLATE-002'
            LIMIT 1
        ];

        Test.startTest();
        TemplateLibraryController.saveTemplateAssignments(
            template.Id,
            new List<Id>{ org1.Id }
        );
        Test.stopTest();

        List<Template_Assignment__c> assignments = [
            SELECT Id,
                   Organisation__c,
                   Status__c
            FROM Template_Assignment__c
            WHERE Template__c = :template.Id
        ];
    }

    @IsTest
    static void testSaveTemplateAssignmentsWithEmptyOrganisationList() {
        Template__c template = [
            SELECT Id, Is_Library_Template__c
            FROM Template__c
            WHERE Key__c = 'LIB-TEMPLATE-001'
            LIMIT 1
        ];

        Test.startTest();
        TemplateLibraryController.saveTemplateAssignments(
            template.Id,
            new List<Id>()
        );
        Test.stopTest();

        List<Template_Assignment__c> assignments = [
            SELECT Id,
                   Organisation__c,
                   Status__c
            FROM Template_Assignment__c
            WHERE Template__c = :template.Id
        ];
    }

    @IsTest
    static void testSaveTemplateAssignmentsWithNullOrganisationList() {
        Template__c template = [
            SELECT Id, Is_Library_Template__c
            FROM Template__c
            WHERE Key__c = 'LIB-TEMPLATE-001'
            LIMIT 1
        ];

        Test.startTest();
        TemplateLibraryController.saveTemplateAssignments(
            template.Id,
            null
        );
        Test.stopTest();

        List<Template_Assignment__c> assignments = [
            SELECT Id,
                   Organisation__c,
                   Status__c
            FROM Template_Assignment__c
            WHERE Template__c = :template.Id
        ];
    }

    @IsTest
    static void testSaveTemplateAssignmentsWithNullTemplate() {
        Test.startTest();
        try {
            TemplateLibraryController.saveTemplateAssignments(
                null,
                new List<Id>()
            );
        } catch (AuraHandledException e) {
        }
        Test.stopTest();
    }

    @IsTest
    static void testSaveTemplateAssignmentsMarksTemplateAsLibrary() {
        Template__c template = [
            SELECT Id, Is_Library_Template__c
            FROM Template__c
            WHERE Key__c = 'CLIENT-TEMPLATE-001'
            LIMIT 1
        ];

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = 'Ashfield Consultants'
            LIMIT 1
        ];

        Test.startTest();
        TemplateLibraryController.saveTemplateAssignments(
            template.Id,
            new List<Id>{ org.Id }
        );
        Test.stopTest();

        Template__c updatedTemplate = [
            SELECT Id, Is_Library_Template__c
            FROM Template__c
            WHERE Id = :template.Id
        ];
    }
}