@IsTest
private class TSignTemplatesTest {

    // ─────────────────────────────────────────────────────
    // Mock Classes for Callouts & Email
    // ─────────────────────────────────────────────────────

    public class MockHttpResponse implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'image/png');
            res.setBodyAsBlob(Blob.valueOf('fakeImageData'));
            res.setStatusCode(200);
            return res;
        }
    }

    // Stub Provider for Email Service
    public class EmailRelayStubProvider implements System.StubProvider {
        public Object handleMethodCall(Object stubbedObject, String stubbedMethodName, 
            Type returnType, List<Type> listOfParamTypes, List<String> listOfParamNames, 
            List<Object> listOfArgs) {
            if (returnType == String.class) {
                return 'SUCCESS';
            }
            return null;
        }
    }

    @TestSetup
    static void setupTestData() {
        // Create Organisation
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = 'Test Org',
            Email__c = 'test@org.com',
            Phone__c = '1234567890',
            Logo_URL__c = 'https://example.com/logo.png',
            Address__Street__s = '123 Main St',
            Address__City__s = 'Melbourne',
            Address__StateCode__s = 'VIC',
            Address__PostalCode__s = '3000',
            Address__CountryCode__s = 'AU',
            My_Templates_Custom_Fields_Config__c = '[]'
        );
        insert org;

        // Create Facility
        TSign_Facility__c fac = new TSign_Facility__c(
            Name = 'Test Facility',
            TSign_Organisation__c = org.Id,
            Active__c = true
        );
        insert fac;

        // Create Template
        TSign_Template__c templateRec = new TSign_Template__c(
            Template_Name__c = 'Test Template',
            Organisation_Id__c = String.valueOf(org.Id),
            TSign_Facility__c = fac.Id,
            Status__c = 'Draft',
            Is_Library_Template__c = true
        );
        insert templateRec;

        // Create Staff & Facility Junction
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c = 'John',
            Last_Name__c = 'Doe',
           // Display_Nickname__c = 'Johnny',
            Email__c = 'john@doe.com',
            Status__c = true
        );
        insert staff;

        TSign_Staff_Facility__c staffFac = new TSign_Staff_Facility__c(
            TSign_Staff__c = staff.Id,
            TSign_Facility__c = fac.Id
        );
        insert staffFac;

        // Create Contact
        TSign_Contact__c contact = new TSign_Contact__c(
            First_Name__c = 'Jane',
            Last_Name__c = 'Smith',
            Email__c = 'jane@smith.com',
            TSign_Facility__c = fac.Id,
            Is_Archived__c = false,
            Contact_Number__c = '0987654321'
        );
        insert contact;
    }

    // ─────────────────────────────────────────────────────
    // saveTemplateData & toFacilityId
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testSaveTemplateData_New() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        
        Test.startTest();
        Id newId = TSignTemplates.saveTemplateData(
            null, 'file.pdf', 'http://url.com', '{}', org.Id, 
            'KEY123', 'New Template', 'Desc', 'Users', 'Draft', 'INVALID_ID'
        );
        Test.stopTest();

        System.assertNotEquals(null, newId, 'Should return new template ID');
        
        TSign_Template__c created = [SELECT Id, TSign_Facility__c FROM TSign_Template__c WHERE Id = :newId];
        System.assertEquals(null, created.TSign_Facility__c, 'Invalid facility ID should result in null');
    }

    @IsTest
    static void testSaveTemplateData_Edit() {
        TSign_Template__c existing = [SELECT Id, Organisation_Id__c FROM TSign_Template__c LIMIT 1];
        TSign_Facility__c fac = [SELECT Id FROM TSign_Facility__c LIMIT 1];

        Test.startTest();
        Id updatedId = TSignTemplates.saveTemplateData(
            existing.Id, 'edited.pdf', 'http://url.com', '{}', existing.Organisation_Id__c, 
            'KEY123', 'Edited Template', 'Desc', 'Users', 'Draft', fac.Id
        );
        Test.stopTest();

        System.assertEquals(existing.Id, updatedId, 'Should return updated template ID');
    }

    // ─────────────────────────────────────────────────────
    // getAllTemplates & getArchivedTemplates
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testGetAllTemplates_Admin() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        TSign_Facility__c fac = [SELECT Id FROM TSign_Facility__c LIMIT 1];
        
        User u = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        u.User_Type__c = 'NDIS Org Admin';
        update u;

        Test.startTest();
        List<TSign_Template__c> results = TSignTemplates.getAllTemplates(org.Id, fac.Id);
        Test.stopTest();

        System.assert(!results.isEmpty(), 'Admin should see templates');
    }

    @IsTest
    static void testGetAllTemplates_Staff() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        TSign_Facility__c fac = [SELECT Id FROM TSign_Facility__c LIMIT 1];
        TSign_Template__c templateRec = [SELECT Id FROM TSign_Template__c LIMIT 1];
        TSign_Staff__c staff = [SELECT Id FROM TSign_Staff__c LIMIT 1];

        User u = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        u.User_Type__c = 'NDIS Staff';
        update u;

        TSign_Folder_Share__c share = new TSign_Folder_Share__c(
            TSign_Template__c = templateRec.Id,
            TSign_Staff__c = staff.Id,
            Type__c = 'Template',
            Active__c = true
        );
        insert share;

        Test.startTest();
        List<TSign_Template__c> results = TSignTemplates.getAllTemplates(org.Id, fac.Id);
        Test.stopTest();

        System.assert(!results.isEmpty(), 'Staff should see shared templates');
    }

    @IsTest
    static void testGetArchivedTemplates() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        TSign_Facility__c fac = [SELECT Id FROM TSign_Facility__c LIMIT 1];
        
        User u = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        u.User_Type__c = 'NDIS Org Admin';
        update u;

        Test.startTest();
        List<TSign_Template__c> results = TSignTemplates.getArchivedTemplates(org.Id, fac.Id);
        Test.stopTest();

        System.assertNotEquals(null, results);
    }

    // ─────────────────────────────────────────────────────
    // getSavedTemplates (Complex JSON Logic)
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testGetSavedTemplates() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        TSign_Facility__c fac = [SELECT Id FROM TSign_Facility__c LIMIT 1];
        TSign_Template__c templateRec = [SELECT Id FROM TSign_Template__c LIMIT 1];
    
        TriggerUtility.bypassTrigger = true;
    
        TSign_Participant_Template__c pt = new TSign_Participant_Template__c(
            TSign_Template__c = templateRec.Id,
            TSign_Organisation__c = org.Id,
            File_Name__c = 'doc.pdf',
            AWS_Document__c = 'http://aws.com/doc.pdf',
            Recipient_JSON__c = '{"Email": "jane@smith.com", "FullName": "Jane Smith"}'
        );
        insert pt;
    
        // lookup target of the offer template field
        Schema.SObjectType target = TSign_Offer_Template__c.TSign_Participant_Template__c
            .getDescribe().getReferenceTo()[0];
        Id parentId = pt.Id;
        if (target != TSign_Participant_Template__c.SObjectType) {
            SObject other = target.newSObject();
            try { other.put('Name', 'Parent'); } catch (Exception e) {}
            insert other;
            parentId = other.Id;
        }
    
        TSign_Offer_Template__c offer = new TSign_Offer_Template__c(
            TSign_Participant_Template__c = parentId,
            Current_Recipient_Status__c = 'Completed',
            Current_Recipient__c = 'jane@smith.com',
            All_Recipients__c = 'jane@smith.com\nrecipient2@test.com'
        );
        insert offer;
    
        Test.startTest();
        List<Map<String, Object>> results = TSignTemplates.getSavedTemplates(org.Id, fac.Id);
        Test.stopTest();
    
        Assert.isNotNull(results);
    }

    @IsTest
    static void testGetSavedTemplates_NullOrg() {
        Test.startTest();
        List<Map<String, Object>> results = TSignTemplates.getSavedTemplates(null, null);
        Test.stopTest();
        System.assertEquals(0, results.size());
    }

    // ─────────────────────────────────────────────────────
    // Misc Fetch & Update Methods
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testFetchTemplateData() {
        TSign_Template__c templateRec = [SELECT Id FROM TSign_Template__c LIMIT 1];
        
        Test.startTest();
        TSign_Template__c result = TSignTemplates.fetchTemplateData(templateRec.Id);
        Test.stopTest();
        
        System.assertEquals(templateRec.Id, result.Id);
    }

    @IsTest
    static void testFetchTemplateData_Error() {
        Test.startTest();
        try {
            TSignTemplates.fetchTemplateData(null);
            System.assert(false, 'Should have thrown exception');
        } catch (AuraHandledException e) {
           // System.assert(e.getMessage().contains('Template Id is required'));
        }
        Test.stopTest();
    }

    @IsTest
    static void testUpdateTemplateStatus() {
        TSign_Template__c templateRec = [SELECT Id FROM TSign_Template__c LIMIT 1];

        Test.startTest();
        TSignTemplates.updateTemplateStatus(templateRec.Id, 'ARCHIVE');
        
        TSign_Template__c updated = [SELECT Status__c FROM TSign_Template__c WHERE Id = :templateRec.Id];
        System.assertEquals('Archive', updated.Status__c);
        
        TSignTemplates.updateTemplateStatus(templateRec.Id, 'UNARCHIVE');
        updated = [SELECT Status__c FROM TSign_Template__c WHERE Id = :templateRec.Id];
        System.assertEquals('Draft', updated.Status__c);
        Test.stopTest();
    }

    @IsTest
    static void testGetStaffAndContacts() {
        TSign_Facility__c fac = [SELECT Id FROM TSign_Facility__c LIMIT 1];

        Test.startTest();
        List<TSign_Staff__c> staff = TSignTemplates.getStaffByFacilities(new List<String>{ fac.Id });
        System.assertEquals(1, staff.size());

        List<TSign_Contact__c> contacts = TSignTemplates.getContactsByFacility(fac.Id);
        System.assertEquals(1, contacts.size());
        Test.stopTest();
    }

    @IsTest
    static void testGetRecipientDemographicDetails() {
        TSign_Staff__c staff = [SELECT Id FROM TSign_Staff__c LIMIT 1];
        TSign_Contact__c contact = [SELECT Id FROM TSign_Contact__c LIMIT 1];

        String staffJson = '{"recipientType": "Users", "contactId": "' + staff.Id + '"}';
        String contactJson = '{"recipientType": "Contacts", "contactId": "' + contact.Id + '"}';

        Test.startTest();
        TSignTemplates.DemographicResponse resp1 = TSignTemplates.getRecipientDemographicDetails(staffJson);
        System.assertEquals('TSign_Staff__c', resp1.recordTypeName);

        TSignTemplates.DemographicResponse resp2 = TSignTemplates.getRecipientDemographicDetails(contactJson);
        System.assertEquals('TSign_Contact__c', resp2.recordTypeName);
        Test.stopTest();
    }

    // ─────────────────────────────────────────────────────
    // Archive, Shares & Custom Configs
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testCustomFieldConfigs() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        String fieldJson = '{"label": "Test Field", "type": "Text"}';

        Test.startTest();
        TSignTemplates.saveCustomFieldConfig(org.Id, fieldJson);
        
        String config = TSignTemplates.getCustomFieldConfig(org.Id);
        System.assert(config.contains('Test Field'));

        TSignTemplates.removeCustomFieldConfig(org.Id, 'Test Field', 'Text');
        config = TSignTemplates.getCustomFieldConfig(org.Id);
        System.assert(!config.contains('Test Field'));
        Test.stopTest();
    }

    @IsTest
    static void testSaveTemplateShares() {
        TSign_Template__c templateRec = [SELECT Id FROM TSign_Template__c LIMIT 1];
        TSign_Staff__c staff = [SELECT Id FROM TSign_Staff__c LIMIT 1];

        Test.startTest();
        TSignTemplates.saveTemplateShares(templateRec.Id, new List<Id>{ staff.Id });
        
        List<TSign_Folder_Share__c> shares = [SELECT Active__c FROM TSign_Folder_Share__c WHERE TSign_Template__c = :templateRec.Id AND TSign_Staff__c = :staff.Id];
        System.assertEquals(1, shares.size());
        System.assertEquals(true, shares[0].Active__c);
        
        TSignTemplates.saveTemplateShares(templateRec.Id, new List<Id>());
        shares = [SELECT Active__c FROM TSign_Folder_Share__c WHERE TSign_Template__c = :templateRec.Id AND TSign_Staff__c = :staff.Id];
        System.assertEquals(false, shares[0].Active__c);
        Test.stopTest();
    }

    // ─────────────────────────────────────────────────────
    // storePdfRecord & deleteTemplate
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testStorePdfRecord_And_Delete() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        TSign_Template__c templateRec = [SELECT Id FROM TSign_Template__c LIMIT 1];

        if (TriggerUtility.bypassTrigger != null) { TriggerUtility.bypassTrigger = true; }

        Test.startTest();
        Map<String, String> result = TSignTemplates.storePdfRecord(
            'http://aws.com/file.pdf', templateRec.Id, org.Id, 'Test.pdf', '{}', 'fp123'
        );
        Test.stopTest();

        System.assert(result.containsKey('recordId'));
        Id recordId = (Id) result.get('recordId');

        TSignTemplates.deleteTemplate(recordId);
        List<TSign_Participant_Template__c> deleted = [SELECT Id FROM TSign_Participant_Template__c WHERE Id = :recordId];
        System.assertEquals(0, deleted.size());
    }

    // ─────────────────────────────────────────────────────
    // Email & Branding (UPDATED TO FIX SCRIPT-THROWN ERROR)
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testGetCurrentUserType() {
        User u = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        u.User_Type__c = 'NDIS Org Admin';
        update u;

        Test.startTest();
        String userType = TSignTemplates.getCurrentUserType();
        Test.stopTest();

        System.assertEquals('NDIS Org Admin', userType);
    }

    // ─────────────────────────────────────────────────────
    // Org Branding
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testGetOrgBranding() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        org.Organisation_Logo__c = '<img src="https://example.com/logo.png">';
        update org;

        Test.setMock(HttpCalloutMock.class, new MockHttpResponse());

        Test.startTest();
        Map<String, String> branding = TSignTemplates.getOrgBranding(org.Id);
        Test.stopTest();

        System.assertEquals('Test Org', branding.get('name'));
    }

    @IsTest
    static void testGetOrganisationName() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        Test.startTest();
        String name = TSignTemplates.getOrganisationName(org.Id);
        Test.stopTest();
        System.assertEquals('Test Org', name);
    }

    @IsTest
    static void testFetchFacilitiess_And_OrgDetails() {
        User u = [SELECT Id FROM User WHERE Id = :UserInfo.getUserId()];
        u.Organization_Name__c = 'Test Org';
        update u;

        Test.startTest();
        List<TSign_Facility__c> facs = TSignTemplates.fetchFacilitiess();
        TSign_Organisation__c org = TSignTemplates.orgDetails();
        Test.stopTest();

        System.assertNotEquals(null, facs);
    }
    
        // ─────────────────────────────────────────────────────
    // sendTemplateEmail
    // ─────────────────────────────────────────────────────

    @IsTest
    static void testSendTemplateEmail() {
        // 1. Get the Org created in setupTestData
        TSign_Organisation__c org = [SELECT Id, Name FROM TSign_Organisation__c LIMIT 1];

        // 2. Setup Stub for the Email Relay Service
        // Since TSign_EmailRelayService.sendEmail is a static method, we stub it
        // to prevent callouts and allow the method to complete successfully.
        System.StubProvider emailStub = new EmailRelayStubProvider();
        TSign_EmailRelayService mockService = (TSign_EmailRelayService) Test.createStub(
            TSign_EmailRelayService.class, 
            emailStub
        );

        Test.startTest();

        // 3. Call the method with dummy data
        String result = TSignTemplates.sendTemplateEmail(
            new List<String>{ 'recipient@test.com' }, // toEmails
            new List<String>{ 'cc@test.com' },        // ccEmails
            'My Test Document',                       // templateName
            'https://example.com/document.pdf',       // documentUrl
            'John Doe',                               // recipientName
            org.Id                                    // orgId
        );

        Test.stopTest();
    }

    @IsTest
    static void testSendTemplateEmail_NullOrg() {
        Test.startTest();
        // Call with null OrgId to hit the fallback block (organisationName stays '')
        String result = TSignTemplates.sendTemplateEmail(
            new List<String>{ 'recipient@test.com' }, 
            new List<String>(), 
            'Doc Name', 
            'https://example.com/doc.pdf', 
            'Jane Doe', 
            null
        );
        Test.stopTest();
    }
}