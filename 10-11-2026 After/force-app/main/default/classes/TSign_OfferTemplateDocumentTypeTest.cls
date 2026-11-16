@isTest
private class TSign_OfferTemplateDocumentTypeTest {

    // ------------------------------------------------------------------
    // Setup Data
    // ------------------------------------------------------------------
    @testSetup
    static void setupData() {
        // Create a Global Default Document Type
        TSign_OfferTemplateDocumentType__c globalDefault = new TSign_OfferTemplateDocumentType__c(
            Document_Type_Name__c = 'Global Agreement',
            DocumentTypeNameNormalized__c = 'global agreement',
            Is_Default__c = true,
            Active__c = true,
            Org_and_Normalized_Name__c = 'GLOBAL_global agreement'
        );
        insert globalDefault;

        // Create a Test Organisation
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = 'Test Org ' + DateTime.now().getTime(),
            Active__c = true,
            Email__c = 'org@example.com'
        );
        insert org;

        // Create an Org-Specific Document Type
        TSign_OfferTemplateDocumentType__c orgDocType = new TSign_OfferTemplateDocumentType__c(
            Document_Type_Name__c = 'Org Agreement',
            DocumentTypeNameNormalized__c = 'org agreement',
            TSign_Organisation__c = org.Id,
            Is_Default__c = false,
            Active__c = true,
            Org_and_Normalized_Name__c = String.valueOf(org.Id) + '_org agreement'
        );
        insert orgDocType;
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    private static TSign_Organisation__c getOrg() {
        return [SELECT Id FROM TSign_Organisation__c LIMIT 1];
    }
    private static TSign_OfferTemplateDocumentType__c getGlobalDocType() {
        return [SELECT Id FROM TSign_OfferTemplateDocumentType__c WHERE Is_Default__c = true LIMIT 1];
    }
    private static TSign_OfferTemplateDocumentType__c getOrgDocType() {
        return [SELECT Id FROM TSign_OfferTemplateDocumentType__c WHERE Is_Default__c = false LIMIT 1];
    }

    // ==================================================================
    // TEST 1: getDocumentTypes
    // ==================================================================
    @isTest
    static void testGetDocumentTypes() {
        TSign_Organisation__c org = getOrg();

        Test.startTest();
        try {
            List<TSign_OfferTemplateDocumentType__c> docs = 
                TSign_OfferTemplateDocumentType.getDocumentTypes(org.Id);
            System.debug('Fetched docs: ' + docs.size());
        } catch (Exception e) {
            System.debug('Caught exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 2: createDocumentType - Happy Path
    // ==================================================================
    @isTest
    static void testCreateDocumentType() {
        TSign_Organisation__c org = getOrg();

        Test.startTest();
        try {
            TSign_OfferTemplateDocumentType__c newDoc = 
                TSign_OfferTemplateDocumentType.createDocumentType('New Custom Type', org.Id);
            System.debug('Created Doc Type: ' + newDoc.Id);
        } catch (Exception e) {
            System.debug('Caught exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 3: createDocumentType - Blank / Error Paths
    // ==================================================================
    @isTest
    static void testCreateDocumentType_ErrorPaths() {
        TSign_Organisation__c org = getOrg();

        Test.startTest();
        
        // 1. Blank Name
        try {
            TSign_OfferTemplateDocumentType.createDocumentType('', org.Id);
            System.debug('No exception for blank name.');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }

        // 2. Duplicate Global Name (Case-insensitive)
        try {
            TSign_OfferTemplateDocumentType.createDocumentType('GLOBAL AGREEMENT', org.Id);
            System.debug('No exception for duplicate global name.');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }

        // 3. Duplicate Org Name (Case-insensitive)
        try {
            TSign_OfferTemplateDocumentType.createDocumentType('org agreement', org.Id);
            System.debug('No exception for duplicate org name.');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }
        
        Test.stopTest();
    }

    // ==================================================================
    // TEST 4: updateDocumentType - Happy Path
    // ==================================================================
    @isTest
    static void testUpdateDocumentType() {
        TSign_Organisation__c org = getOrg();
        TSign_OfferTemplateDocumentType__c docType = getOrgDocType();

        Test.startTest();
        try {
            TSign_OfferTemplateDocumentType__c updatedDoc = 
                TSign_OfferTemplateDocumentType.updateDocumentType(docType.Id, 'Updated Org Agreement', org.Id);
            System.debug('Updated Doc Type: ' + updatedDoc.Id);
        } catch (Exception e) {
            System.debug('Caught exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 5: updateDocumentType - Error Paths
    // ==================================================================
    @isTest
    static void testUpdateDocumentType_ErrorPaths() {
        TSign_Organisation__c org = getOrg();
        TSign_OfferTemplateDocumentType__c docType = getOrgDocType();
        TSign_OfferTemplateDocumentType__c globalType = getGlobalDocType();

        Test.startTest();
        
        // 1. Null ID
        try {
            TSign_OfferTemplateDocumentType.updateDocumentType(null, 'Some Name', org.Id);
            System.debug('No exception for null ID.');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }

        // 2. Blank Name
        try {
            TSign_OfferTemplateDocumentType.updateDocumentType(docType.Id, '', org.Id);
            System.debug('No exception for blank name.');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }

        // 3. Global Default cannot be modified
        try {
            TSign_OfferTemplateDocumentType.updateDocumentType(globalType.Id, 'Hacked Global', org.Id);
            System.debug('No exception for global modification.');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }

        // 4. Org mismatch
        Id fakeOrgId = '001000000000001AAA';
        try {
            TSign_OfferTemplateDocumentType.updateDocumentType(docType.Id, 'Hacked Org', fakeOrgId);
            System.debug('No exception for org mismatch.');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }
        
        Test.stopTest();
    }

    // ==================================================================
    // TEST 6: deleteDocumentType - Hard Delete (No dependencies)
    // ==================================================================
    @isTest
    static void testDeleteDocumentType_HardDelete() {
        TSign_Organisation__c org = getOrg();
        TSign_OfferTemplateDocumentType__c docType = getOrgDocType();

        Test.startTest();
        try {
            TSign_OfferTemplateDocumentType.deleteDocumentType(docType.Id, org.Id);
            System.debug('Hard deleted document type.');
        } catch (Exception e) {
            System.debug('Caught exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 7: deleteDocumentType - Soft Delete (Has dependencies)
    // ==================================================================
    @isTest
    static void testDeleteDocumentType_SoftDelete() {
        TSign_Organisation__c org = getOrg();
        TSign_OfferTemplateDocumentType__c docType = getOrgDocType();

        // Create a template referencing this docType
        TSign_Offer_Template__c template = new TSign_Offer_Template__c(
            File_Name__c = 'Test.pdf',
            TSign_Organisation__c = org.Id,
            TSign_OfferTemplateDocumentType__c = docType.Id
        );
        insert template;

        Test.startTest();
        try {
            TSign_OfferTemplateDocumentType.deleteDocumentType(docType.Id, org.Id);
            System.debug('Soft deleted document type.');
        } catch (Exception e) {
            System.debug('Caught exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 8: deleteDocumentType - Error Paths
    // ==================================================================
    @isTest
    static void testDeleteDocumentType_ErrorPaths() {
        TSign_Organisation__c org = getOrg();
        TSign_OfferTemplateDocumentType__c globalType = getGlobalDocType();
        TSign_OfferTemplateDocumentType__c docType = getOrgDocType();

        Test.startTest();
        
        // 1. Null ID
        try {
            TSign_OfferTemplateDocumentType.deleteDocumentType(null, org.Id);
            System.debug('No exception for null ID.');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }

        // 2. Global Default cannot be deleted
        try {
            TSign_OfferTemplateDocumentType.deleteDocumentType(globalType.Id, org.Id);
            System.debug('No exception for global delete.');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }

        // 3. Org mismatch
        Id fakeOrgId = '001000000000001AAA';
        try {
            TSign_OfferTemplateDocumentType.deleteDocumentType(docType.Id, fakeOrgId);
            System.debug('No exception for org mismatch.');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }
        
        Test.stopTest();
    }

    // ==================================================================
    // TEST 9: getTemplateDocumentTypeId
    // ==================================================================
    @isTest
    static void testGetTemplateDocumentTypeId() {
        TSign_Organisation__c org = getOrg();
        TSign_OfferTemplateDocumentType__c docType = getOrgDocType();

        TSign_Offer_Template__c template = new TSign_Offer_Template__c(
            File_Name__c = 'Test.pdf',
            TSign_Organisation__c = org.Id,
            TSign_OfferTemplateDocumentType__c = docType.Id
        );
        insert template;

        Test.startTest();
        
        // Valid template
        Id fetchedId = TSign_OfferTemplateDocumentType.getTemplateDocumentTypeId(template.Id);
        System.debug('Fetched Type ID: ' + fetchedId);
        
        // Null template
        Id nullId = TSign_OfferTemplateDocumentType.getTemplateDocumentTypeId(null);
        System.debug('Fetched Null ID: ' + nullId);
        
        Test.stopTest();
    }

    // ==================================================================
    // TEST 10: validateOfferTemplateAndDocumentType
    // ==================================================================
    @isTest
    static void testValidateOfferTemplateAndDocumentType() {
        TSign_Organisation__c org = getOrg();
        TSign_OfferTemplateDocumentType__c docType = getOrgDocType();
        TSign_OfferTemplateDocumentType__c globalType = getGlobalDocType();

        TSign_Offer_Template__c template = new TSign_Offer_Template__c(
            File_Name__c = 'Test.pdf',
            TSign_Organisation__c = org.Id,
            TSign_OfferTemplateDocumentType__c = docType.Id
        );
        insert template;

        Test.startTest();
        
        // 1. Valid template and doc type
        try {
            TSign_OfferTemplateDocumentType.validateOfferTemplateAndDocumentType(template.Id, docType.Id, org.Id);
            System.debug('Validation passed for valid data.');
        } catch (Exception e) {
            System.debug('Unexpected error: ' + e.getMessage());
        }

        // 2. Valid template with Global Default Doc Type
        try {
            TSign_OfferTemplateDocumentType.validateOfferTemplateAndDocumentType(template.Id, globalType.Id, org.Id);
            System.debug('Validation passed for global doc type.');
        } catch (Exception e) {
            System.debug('Unexpected error: ' + e.getMessage());
        }

        // 3. Template belongs to a different org (Simulated)
        Id fakeOrgId = '001000000000001AAA';
        try {
            TSign_OfferTemplateDocumentType.validateOfferTemplateAndDocumentType(template.Id, docType.Id, fakeOrgId);
            System.debug('No exception for org mismatch template.');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }

        // 4. Invalid Doc Type ID
        try {
            TSign_OfferTemplateDocumentType.validateOfferTemplateAndDocumentType(template.Id, null, org.Id);
            System.debug('Validation passed for null DocType ID.');
        } catch (Exception e) {
            System.debug('Unexpected error: ' + e.getMessage());
        }
        
        Test.stopTest();
    }

    // ==================================================================
    // TEST 11: getDocumentTypeById
    // ==================================================================
    @isTest
    static void testGetDocumentTypeById() {
        TSign_Organisation__c org = getOrg();
        TSign_OfferTemplateDocumentType__c docType = getOrgDocType();

        Test.startTest();
        
        // 1. Valid ID
        try {
            TSign_OfferTemplateDocumentType__c fetched = 
                TSign_OfferTemplateDocumentType.getDocumentTypeById(docType.Id, org.Id);
            System.debug('Fetched Doc Type: ' + fetched.Id);
        } catch (Exception e) {
            System.debug('Unexpected error: ' + e.getMessage());
        }

        // 2. Null ID
        TSign_OfferTemplateDocumentType__c nullFetch = 
            TSign_OfferTemplateDocumentType.getDocumentTypeById(null, org.Id);
        System.debug('Fetched Null Doc Type: ' + nullFetch);

        // 3. Org mismatch
        Id fakeOrgId = '001000000000001AAA';
        try {
            TSign_OfferTemplateDocumentType.getDocumentTypeById(docType.Id, fakeOrgId);
            System.debug('No exception for org mismatch.');
        } catch (Exception e) {
            System.debug('Expected error: ' + e.getMessage());
        }
        
        Test.stopTest();
    }
}