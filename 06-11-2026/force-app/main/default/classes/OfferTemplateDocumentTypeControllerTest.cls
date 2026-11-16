@IsTest
private class OfferTemplateDocumentTypeControllerTest {

 
@testSetup
static void setupData() {
    TestDataFactory.createBaseData();
}

private static Organisation__c getOrganisation() {
    return [
        SELECT Id, Name
        FROM Organisation__c
        WHERE Name = 'Ashfield Consultants'
        LIMIT 1
    ];
}

private static User getTestUser() {
    return [
        SELECT Id, Username, Organization_Name__c
        FROM User
        WHERE Username = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];
}

@IsTest
static void testGetDocumentTypes() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c globalType = new OfferTemplateDocumentType__c(
        Document_Type_Name__c = 'Global Document',
        DocumentTypeNameNormalized__c = 'global document',
        Is_Default__c = true,
        Active__c = true
    );

    OfferTemplateDocumentType__c orgType = new OfferTemplateDocumentType__c(
        Document_Type_Name__c = 'Organisation Document',
        DocumentTypeNameNormalized__c = 'organisation document',
        Organization__c = org.Id,
        Is_Default__c = false,
        Active__c = true,
        Org_and_Normalized_Name__c = String.valueOf(org.Id) + '_organisation document'
    );

    insert new List<OfferTemplateDocumentType__c>{globalType, orgType};

    Test.startTest();
    List<OfferTemplateDocumentType__c> result =
        OfferTemplateDocumentTypeController.getDocumentTypes(org.Id);
    Test.stopTest();
}

@IsTest
static void testCreateDocumentType() {
    Organisation__c org = getOrganisation();

    Test.startTest();
    OfferTemplateDocumentType__c result =
        OfferTemplateDocumentTypeController.createDocumentType(
            '  Custom Document Type  ',
            org.Id
        );
    Test.stopTest();
}

@IsTest
static void testCreateDocumentTypeBlankName() {
    Organisation__c org = getOrganisation();

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.createDocumentType('', org.Id);
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testCreateDocumentTypeWhitespaceName() {
    Organisation__c org = getOrganisation();

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.createDocumentType('   ', org.Id);
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testCreateDocumentTypeDuplicate() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentTypeController.createDocumentType(
        'Duplicate Document',
        org.Id
    );

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.createDocumentType(
            '  DUPLICATE DOCUMENT  ',
            org.Id
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testUpdateDocumentType() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType =
        OfferTemplateDocumentTypeController.createDocumentType(
            'Original Document',
            org.Id
        );

    Test.startTest();
    OfferTemplateDocumentType__c result =
        OfferTemplateDocumentTypeController.updateDocumentType(
            docType.Id,
            '  Updated Document  ',
            org.Id
        );
    Test.stopTest();
}

@IsTest
static void testUpdateDocumentTypeNullId() {
    Organisation__c org = getOrganisation();

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.updateDocumentType(
            null,
            'Test Document',
            org.Id
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testUpdateDocumentTypeBlankName() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType =
        OfferTemplateDocumentTypeController.createDocumentType(
            'Update Blank Test',
            org.Id
        );

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.updateDocumentType(
            docType.Id,
            '',
            org.Id
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testUpdateDocumentTypeWhitespaceName() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType =
        OfferTemplateDocumentTypeController.createDocumentType(
            'Update Whitespace Test',
            org.Id
        );

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.updateDocumentType(
            docType.Id,
            '   ',
            org.Id
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testUpdateDefaultDocumentType() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType = new OfferTemplateDocumentType__c(
        Document_Type_Name__c = 'Default Update Test',
        DocumentTypeNameNormalized__c = 'default update test',
        Is_Default__c = true,
        Active__c = true
    );
    insert docType;

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.updateDocumentType(
            docType.Id,
            'Updated Default',
            org.Id
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testUpdateDocumentTypeWrongOrganisation() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType =
        OfferTemplateDocumentTypeController.createDocumentType(
            'Wrong Organisation Test',
            org.Id
        );

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.updateDocumentType(
            docType.Id,
            'Updated Name',
            UserInfo.getUserId()
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testUpdateDocumentTypeDuplicate() {
Organisation__c org = getOrganisation();
 
OfferTemplateDocumentType__c first = new OfferTemplateDocumentType__c(
    Document_Type_Name__c = 'First Update Document',
    DocumentTypeNameNormalized__c = 'first update document',
    Organization__c = org.Id,
    Is_Default__c = false,
    Active__c = true,
    Org_and_Normalized_Name__c = String.valueOf(org.Id) + '_first update document'
);

OfferTemplateDocumentType__c second = new OfferTemplateDocumentType__c(
    Document_Type_Name__c = 'Second Update Document',
    DocumentTypeNameNormalized__c = 'second update document',
    Organization__c = org.Id,
    Is_Default__c = false,
    Active__c = true,
    Org_and_Normalized_Name__c = String.valueOf(org.Id) + '_second update document'
);

insert new List<OfferTemplateDocumentType__c>{ first, second };

Test.startTest();
try {
    OfferTemplateDocumentTypeController.updateDocumentType(
        first.Id,
        'Second Update Document',
        org.Id
    );
} catch (Exception ex) {
}
Test.stopTest();
 

}


    @IsTest
    static void testDeleteDocumentType() {
    Organisation__c org = [
    SELECT Id
    FROM Organisation__c
    WHERE Name = 'Ashfield Consultants'
    LIMIT 1
    ];
    
     
    OfferTemplateDocumentType__c docType = new OfferTemplateDocumentType__c(
        Document_Type_Name__c = 'Delete Document',
        DocumentTypeNameNormalized__c = 'delete document',
        Organization__c = org.Id,
        Is_Default__c = false,
        Active__c = true,
        Org_and_Normalized_Name__c = String.valueOf(org.Id) + '_delete document'
    );
    insert docType;
    
    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.deleteDocumentType(
            docType.Id,
            org.Id
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
     
    
    }


@IsTest
static void testDeleteDocumentTypeNullId() {
    Organisation__c org = getOrganisation();

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.deleteDocumentType(
            null,
            org.Id
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testDeleteDefaultDocumentType() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType = new OfferTemplateDocumentType__c(
        Document_Type_Name__c = 'Default Delete Test',
        DocumentTypeNameNormalized__c = 'default delete test',
        Is_Default__c = true,
        Active__c = true
    );
    insert docType;

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.deleteDocumentType(
            docType.Id,
            org.Id
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testDeleteDocumentTypeWrongOrganisation() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType =
        OfferTemplateDocumentTypeController.createDocumentType(
            'Wrong Organisation Delete',
            org.Id
        );

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.deleteDocumentType(
            docType.Id,
            UserInfo.getUserId()
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testGetTemplateDocumentTypeIdNull() {
    Test.startTest();
    Id result =
        OfferTemplateDocumentTypeController.getTemplateDocumentTypeId(null);
    Test.stopTest();
}

@IsTest
static void testGetTemplateDocumentTypeIdInvalidTemplate() {
    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.getTemplateDocumentTypeId(
            UserInfo.getUserId()
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testValidateOfferTemplateAndDocumentTypeNullValues() {
    Organisation__c org = getOrganisation();

    Test.startTest();
    OfferTemplateDocumentTypeController.validateOfferTemplateAndDocumentType(
        null,
        null,
        org.Id
    );
    Test.stopTest();
}

@IsTest
static void testValidateDocumentTypeValidOrganisation() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType =
        OfferTemplateDocumentTypeController.createDocumentType(
            'Validation Document',
            org.Id
        );

    Test.startTest();
    OfferTemplateDocumentTypeController.validateOfferTemplateAndDocumentType(
        null,
        docType.Id,
        org.Id
    );
    Test.stopTest();
}

@IsTest
static void testValidateDefaultDocumentType() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType = new OfferTemplateDocumentType__c(
        Document_Type_Name__c = 'Validation Default',
        DocumentTypeNameNormalized__c = 'validation default',
        Is_Default__c = true,
        Active__c = true
    );
    insert docType;

    Test.startTest();
    OfferTemplateDocumentTypeController.validateOfferTemplateAndDocumentType(
        null,
        docType.Id,
        org.Id
    );
    Test.stopTest();
}

@IsTest
static void testValidateInvalidDocumentType() {
    Organisation__c org = getOrganisation();

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.validateOfferTemplateAndDocumentType(
            null,
            UserInfo.getUserId(),
            org.Id
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testValidateWrongOrganisationDocumentType() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType =
        OfferTemplateDocumentTypeController.createDocumentType(
            'Validation Wrong Organisation',
            org.Id
        );

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.validateOfferTemplateAndDocumentType(
            null,
            docType.Id,
            UserInfo.getUserId()
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testValidateInactiveDocumentType() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType =
        OfferTemplateDocumentTypeController.createDocumentType(
            'Inactive Validation Document',
            org.Id
        );

    docType.Active__c = false;
    update docType;

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.validateOfferTemplateAndDocumentType(
            null,
            docType.Id,
            org.Id
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}

@IsTest
static void testGetDocumentTypeByIdNull() {
    Organisation__c org = getOrganisation();

    Test.startTest();
    OfferTemplateDocumentType__c result =
        OfferTemplateDocumentTypeController.getDocumentTypeById(
            null,
            org.Id
        );
    Test.stopTest();
}

@IsTest
static void testGetDocumentTypeByIdValid() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType =
        OfferTemplateDocumentTypeController.createDocumentType(
            'Get By Id Document',
            org.Id
        );

    Test.startTest();
    OfferTemplateDocumentType__c result =
        OfferTemplateDocumentTypeController.getDocumentTypeById(
            docType.Id,
            org.Id
        );
    Test.stopTest();
}

@IsTest
static void testGetDocumentTypeByIdDefault() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType = new OfferTemplateDocumentType__c(
        Document_Type_Name__c = 'Get Default By Id',
        DocumentTypeNameNormalized__c = 'get default by id',
        Is_Default__c = true,
        Active__c = true
    );
    insert docType;

    Test.startTest();
    OfferTemplateDocumentType__c result =
        OfferTemplateDocumentTypeController.getDocumentTypeById(
            docType.Id,
            org.Id
        );
    Test.stopTest();
}

@IsTest
static void testGetDocumentTypeByIdWrongOrganisation() {
    Organisation__c org = getOrganisation();

    OfferTemplateDocumentType__c docType =
        OfferTemplateDocumentTypeController.createDocumentType(
            'Get Wrong Organisation',
            org.Id
        );

    Test.startTest();
    try {
        OfferTemplateDocumentTypeController.getDocumentTypeById(
            docType.Id,
            UserInfo.getUserId()
        );
    } catch (Exception ex) {
    }
    Test.stopTest();
}
 

}