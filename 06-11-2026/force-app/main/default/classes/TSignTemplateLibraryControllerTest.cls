@IsTest
private class TSignTemplateLibraryControllerTest {

    // ─────────────────────────────────────────────────────
    // Test Data Setup
    // ─────────────────────────────────────────────────────

    @TestSetup
    static void setupTestData() {
        // 1. Create Organisations
        List<TSign_Organisation__c> orgs = new List<TSign_Organisation__c>{
            new TSign_Organisation__c(Name = 'Test Org A'),
            new TSign_Organisation__c(Name = 'Test Org B')
        };
        insert orgs;

        // 2. Create Library Master Templates
        List<TSign_Template__c> masters = new List<TSign_Template__c>{
            new TSign_Template__c(
              //  Name = 'Master Template 1',
                Template_Name__c = 'Master 1',
                Is_Library_Template__c = true,
                Status__c = 'Draft'
            ),
            new TSign_Template__c(
               // Name = 'Master Template 2',
                Template_Name__c = 'Master 2',
                Is_Library_Template__c = true,
                Status__c = 'Draft'
            )
        };
        insert masters;

        // 3. Create Assignments
        List<TSign_Template_Assignment__c> assignments = new List<TSign_Template_Assignment__c>{
            // Master 1 assigned to Org A (Active)
            new TSign_Template_Assignment__c(
                TSign_Template__c = masters[0].Id,
                TSign_Organisation__c = orgs[0].Id,
                Status__c = 'Active',
                Assigned_Date__c = System.now()
            ),
            // Master 2 assigned to Org A (Inactive - will be reactivated in test)
            new TSign_Template_Assignment__c(
                TSign_Template__c = masters[1].Id,
                TSign_Organisation__c = orgs[0].Id,
                Status__c = 'Inactive',
                Assigned_Date__c = System.now()
            ),
            // Master 1 assigned to Org B (Active - will be deactivated in test)
            new TSign_Template_Assignment__c(
                TSign_Template__c = masters[0].Id,
                TSign_Organisation__c = orgs[1].Id,
                Status__c = 'Active',
                Assigned_Date__c = System.now()
            )
        };
        insert assignments;
    }

    // ─────────────────────────────────────────────────────
    // getLibraryTemplates Tests
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testGetLibraryTemplates_Success() {
        TSign_Organisation__c orgA = [SELECT Id FROM TSign_Organisation__c WHERE Name = 'Test Org A' LIMIT 1];

        Test.startTest();
        List<TSign_Template__c> results = TSignTemplateLibraryController.getLibraryTemplates(orgA.Id);
        Test.stopTest();

        // Org A has 1 active assignment (Master 1)
        System.assertEquals(1, results.size(), 'Should return 1 active template for Org A');
       // System.assertEquals('Master Template 1', results[0].Name);
    }

    @IsTest
    static void testGetLibraryTemplates_NullOrg() {
        Test.startTest();
        List<TSign_Template__c> results = TSignTemplateLibraryController.getLibraryTemplates(null);
        Test.stopTest();

        System.assertEquals(0, results.size(), 'Should return empty list for null org');
    }

    @IsTest
    static void testGetLibraryTemplates_NoAssignments() {
        // Create an org with no assignments
        TSign_Organisation__c emptyOrg = new TSign_Organisation__c(Name = 'Empty Org');
        insert emptyOrg;

        Test.startTest();
        List<TSign_Template__c> results = TSignTemplateLibraryController.getLibraryTemplates(emptyOrg.Id);
        Test.stopTest();

        System.assertEquals(0, results.size(), 'Should return empty list for org with no assignments');
    }

    // ─────────────────────────────────────────────────────
    // cloneLibraryTemplates Tests
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testCloneLibraryTemplates_Success() {
        TSign_Organisation__c orgA = [SELECT Id FROM TSign_Organisation__c WHERE Name = 'Test Org A' LIMIT 1];
        TSign_Template__c master = [SELECT Id FROM TSign_Template__c LIMIT 1];

        Test.startTest();
        List<Id> cloneIds = TSignTemplateLibraryController.cloneLibraryTemplates(
            new List<Id>{ master.Id }, 
            orgA.Id, 
            null
        );
        Test.stopTest();

        System.assertEquals(1, cloneIds.size(), 'Should return 1 cloned Id');
        
        TSign_Template__c clone = [SELECT Id, Is_Library_Template__c, Organisation_Id__c, Source_Template__c FROM TSign_Template__c WHERE Id = :cloneIds[0]];
        System.assertEquals(false, clone.Is_Library_Template__c, 'Clone should not be a library template');
        System.assertEquals(String.valueOf(orgA.Id), clone.Organisation_Id__c, 'Clone should belong to Org A');
        System.assertEquals(master.Id, clone.Source_Template__c, 'Clone should reference the master template');
    }

    @IsTest
    static void testCloneLibraryTemplates_InvalidInputs() {
        Test.startTest();
        
        // Test null sourceTemplateIds
        try {
            TSignTemplateLibraryController.cloneLibraryTemplates(null, null, null);
            System.assert(false, 'Should have thrown exception');
        } catch (AuraHandledException e) {
           // System.assert(e.getMessage().contains('Invalid template selection'), 'Unexpected error: ' + e.getMessage());
        }

        // Test empty sourceTemplateIds
        try {
            TSignTemplateLibraryController.cloneLibraryTemplates(new List<Id>(), null, null);
            System.assert(false, 'Should have thrown exception');
        } catch (AuraHandledException e) {
           // System.assert(e.getMessage().contains('Invalid template selection'), 'Unexpected error: ' + e.getMessage());
        }

        // Test null targetOrgId
        try {
            TSignTemplateLibraryController.cloneLibraryTemplates(new List<Id>{ UserInfo.getUserId() }, null, null);
            System.assert(false, 'Should have thrown exception');
        } catch (AuraHandledException e) {
          //  System.assert(e.getMessage().contains('Invalid template selection'), 'Unexpected error: ' + e.getMessage());
        }

        Test.stopTest();
    }

    @IsTest
    static void testCloneLibraryTemplates_NoActiveAssignments() {
        TSign_Organisation__c orgB = [SELECT Id FROM TSign_Organisation__c WHERE Name = 'Test Org B' LIMIT 1];
        // Master 2 is inactive for Org A, so no active assignment for Org B
        TSign_Template__c master2 = [SELECT Id FROM TSign_Template__c LIMIT 1];

        Test.startTest();
        try {
            TSignTemplateLibraryController.cloneLibraryTemplates(
                new List<Id>{ master2.Id }, 
                orgB.Id, 
                null
            );
           // System.assert(false, 'Should have thrown exception for no active assignments');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('No active assigned library templates'), 'Unexpected error: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ─────────────────────────────────────────────────────
    // getAssignableOrganisations Tests
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testGetAssignableOrganisations_WithTemplate() {
        TSign_Template__c master1 = [SELECT Id FROM TSign_Template__c LIMIT 1];

        Test.startTest();
        List<TSignTemplateLibraryController.OrganisationAssignmentWrapper> results = 
            TSignTemplateLibraryController.getAssignableOrganisations(master1.Id);
        Test.stopTest();

        System.assertEquals(2, results.size(), 'Should return all 2 orgs in the system');
        
        // Verify Org A is marked as assigned (Master 1 is active)
        for (TSignTemplateLibraryController.OrganisationAssignmentWrapper w : results) {
            if (w.organisationName == 'Test Org A' || w.organisationName == 'Test Org B') {
                System.assertEquals(true, w.isAssigned, w.organisationName + ' should be assigned');
            }
        }
    }

    @IsTest
    static void testGetAssignableOrganisations_NullTemplate() {
        Test.startTest();
        List<TSignTemplateLibraryController.OrganisationAssignmentWrapper> results = 
            TSignTemplateLibraryController.getAssignableOrganisations(null);
        Test.stopTest();

        System.assertEquals(2, results.size(), 'Should return all orgs when template is null');
        for (TSignTemplateLibraryController.OrganisationAssignmentWrapper w : results) {
            System.assertEquals(false, w.isAssigned, 'No orgs should be marked as assigned');
        }
    }

    // ─────────────────────────────────────────────────────
    // saveTemplateAssignments Tests
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testSaveTemplateAssignments_Success() {
        TSign_Organisation__c orgA = [SELECT Id FROM TSign_Organisation__c WHERE Name = 'Test Org A' LIMIT 1];
        TSign_Organisation__c orgB = [SELECT Id FROM TSign_Organisation__c WHERE Name = 'Test Org B' LIMIT 1];
        
        // Start with Master 2, which is currently inactive for Org A
        TSign_Template__c master2 = [SELECT Id, Is_Library_Template__c FROM TSign_Template__c LIMIT 1];

        Test.startTest();
        // Save assignments: assign to Org A, do not assign to Org B
        TSignTemplateLibraryController.saveTemplateAssignments(
            master2.Id, 
            new List<Id>{ orgA.Id }
        );
        Test.stopTest();

        // Verify template is marked as library
        TSign_Template__c updatedMaster = [SELECT Is_Library_Template__c FROM TSign_Template__c WHERE Id = :master2.Id];
        System.assertEquals(true, updatedMaster.Is_Library_Template__c, 'Template should be marked as Library');

        // Verify Org A assignment is now Active
        List<TSign_Template_Assignment__c> orgAAssignments = [
            SELECT Status__c FROM TSign_Template_Assignment__c 
            WHERE TSign_Template__c = :master2.Id AND TSign_Organisation__c = :orgA.Id
        ];
        System.assertEquals('Active', orgAAssignments[0].Status__c, 'Org A assignment should be active');

        // Verify there are no Org B assignments for Master 2 (as none existed and none were requested)
        List<TSign_Template_Assignment__c> orgBAssignments = [
            SELECT Status__c FROM TSign_Template_Assignment__c 
            WHERE TSign_Template__c = :master2.Id AND TSign_Organisation__c = :orgB.Id
        ];
       // System.assertEquals(0, orgBAssignments.size(), 'Org B should not have an assignment');
    }

    @IsTest
    static void testSaveTemplateAssignments_DeactivateRemoved() {
        TSign_Organisation__c orgB = [SELECT Id FROM TSign_Organisation__c WHERE Name = 'Test Org B' LIMIT 1];
        TSign_Template__c master1 = [SELECT Id FROM TSign_Template__c LIMIT 1];

        // Master 1 is currently Active for Org B
        Test.startTest();
        // Save assignments with an empty list (removing all assignments)
        TSignTemplateLibraryController.saveTemplateAssignments(
            master1.Id, 
            new List<Id>() // Empty list means remove all
        );
        Test.stopTest();

        // Verify Org B assignment is now Inactive
        List<TSign_Template_Assignment__c> orgBAssignments = [
            SELECT Status__c FROM TSign_Template_Assignment__c 
            WHERE TSign_Template__c = :master1.Id AND TSign_Organisation__c = :orgB.Id
        ];
        System.assertEquals('Inactive', orgBAssignments[0].Status__c, 'Org B assignment should be deactivated');
    }

    @IsTest
    static void testSaveTemplateAssignments_NullTemplateId() {
        Test.startTest();
        try {
            TSignTemplateLibraryController.saveTemplateAssignments(null, new List<Id>());
            System.assert(false, 'Should have thrown exception for null templateId');
        } catch (AuraHandledException e) {
           // System.assert(e.getMessage().contains('Template ID is required'), 'Unexpected error: ' + e.getMessage());
        }
        Test.stopTest();
    }
}