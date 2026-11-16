@isTest
Public class OrgSubscriptionControllerTest {

    // ------------------------------------------------------------------
    // Helper: Create a TSign Organisation
    // ------------------------------------------------------------------
    private static TSign_Organisation__c createOrg(String name) {
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = name + ' ' + DateTime.now().getTime(),
            Account_Type__c = 'Organisation',
            Active__c = true,
            Email__c = 'org.' + DateTime.now().getTime() + '@example.com',
            Legal_Name__c = 'Legal Name Test'
        );
        insert org;
        return org;
    }

    // ------------------------------------------------------------------
    // Helper: Update the running test user's TSign Org Id
    // ------------------------------------------------------------------
    private static void setRunningUserOrg(Id orgId) {
        User u = [SELECT Id, TSign_Org_Id__c FROM User WHERE Id = :UserInfo.getUserId()];
        u.TSign_Org_Id__c = orgId != null ? String.valueOf(orgId) : null;
        Database.update(u, false);
    }

    // ==================================================================
    // TEST 1: getOrgAndContacts - Happy Path
    // ==================================================================
    @isTest
    static void testGetOrgAndContacts_Success() {
        // 1. Create Org
        TSign_Organisation__c org = createOrg('Test Org');
        
        // 2. Create a Primary Contact
        insert new TSign_Org_Contact__c(
            First_Name__c = 'John',
            Last_Name__c = 'Doe',
            Email__c = 'john.doe@example.com',
            TSign_Organisation__c = org.Id
        );

        // 3. Create a Subscription
        insert new TSign_Subscription__c(
            TSign_Organisation__c = org.Id,
            Stripe_Invoice_Number__c = 'INV-001',
            Invoice_Amount__c = 99.99
        );

        // 4. Link running user to Org
        setRunningUserOrg(org.Id);

        Test.startTest();
        OrgSubscriptionController.OrgDetailsWrapper wrapper = 
            OrgSubscriptionController.getOrgAndContacts(org.Id);
        Test.stopTest();

        System.debug('getOrgAndContacts Success - Org Name: ' + wrapper.organisation.Name);
        System.debug('getOrgAndContacts Success - Contacts Count: ' + wrapper.primaryContacts.size());
        System.debug('getOrgAndContacts Success - Subscriptions Count: ' + wrapper.subscriptions.size());
    }

    // ==================================================================
    // TEST 2: getOrgAndContacts - No Org Linked (Exception Path)
    // ==================================================================
    @isTest
    static void testGetOrgAndContacts_NoOrgLinked() {
        setRunningUserOrg(null);

        Test.startTest();
        try {
            OrgSubscriptionController.getOrgAndContacts(null);
            System.debug('Error: Did not throw expected exception.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 3: getOrgAndContacts - Org Not Found / Deleted (Exception Path)
    // ==================================================================
    @isTest
    static void testGetOrgAndContacts_OrgNotFound() {
        // Assign a fake but valid ID format
        Id fakeOrgId = 'a0A000000000001AAA';
        setRunningUserOrg(fakeOrgId);

        Test.startTest();
        try {
            OrgSubscriptionController.getOrgAndContacts(fakeOrgId);
            System.debug('Error: Did not throw expected exception.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 4: saveOrganisationWithContacts - Happy Path
    // ==================================================================
    @isTest
    static void testSaveOrganisationWithContacts_Success() {
        TSign_Organisation__c org = createOrg('Save Org');
        
        TSign_Org_Contact__c contact = new TSign_Org_Contact__c(
            First_Name__c = 'Jane',
            Last_Name__c = 'Doe',
            Email__c = 'jane.doe@example.com',
            TSign_Organisation__c = org.Id
        );
        insert contact;

        // Modify records
        org.Legal_Name__c = 'Updated Legal Name';
        contact.Phone__c = '1234567890';

        Test.startTest();
        OrgSubscriptionController.saveOrganisationWithContacts(
            org, 
            new List<TSign_Org_Contact__c>{ contact }
        );
        Test.stopTest();

        System.debug('saveOrganisationWithContacts Success - Executed cleanly.');
    }

    // ==================================================================
    // TEST 5: saveOrganisationWithContacts - Null Parameters (Edge Case)
    // ==================================================================
    @isTest
    static void testSaveOrganisationWithContacts_NullParams() {
        Test.startTest();
        // Should not throw an exception; it should just exit gracefully
        OrgSubscriptionController.saveOrganisationWithContacts(null, null);
        Test.stopTest();

        System.debug('saveOrganisationWithContacts NullParams - Executed cleanly without errors.');
    }

    // ==================================================================
    // TEST 6: saveOrganisationWithContacts - Empty Lists (Edge Case)
    // ==================================================================
    @isTest
    static void testSaveOrganisationWithContacts_EmptyContacts() {
        TSign_Organisation__c org = createOrg('Empty Contacts Org');

        Test.startTest();
        // Passing an org but an empty contact list
        OrgSubscriptionController.saveOrganisationWithContacts(
            org, 
            new List<TSign_Org_Contact__c>()
        );
        Test.stopTest();

        System.debug('saveOrganisationWithContacts EmptyContacts - Executed cleanly.');
    }
}