@isTest
private class tSignContactControllerTest {

    @testSetup
    static void setupData() {
        // Create a Base Organisation
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = 'Test Org ' + DateTime.now().getTime(),
            Account_Type__c = 'Business',
            Active__c = true
        );
        insert org;
    }

    private static void setRunningUserOrg(Id orgId) {
        User u = [SELECT Id, TSign_Org_Id__c FROM User WHERE Id = :UserInfo.getUserId()];
        u.TSign_Org_Id__c = orgId != null ? String.valueOf(orgId) : null;
        Database.update(u, false);
    }

    @isTest
    static void testGetAccountType() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        setRunningUserOrg(org.Id);

        Test.startTest();
        String accType = tSignContactController.getAccountType();
        Boolean isIndiv = tSignContactController.isIndividual();
        Test.stopTest();

        System.debug('Account Type fetched: ' + accType);
    }

    @isTest
    static void testGetContacts_NoFacility() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        setRunningUserOrg(org.Id);

        Test.startTest();
        tSignContactController.ContactPage page = 
            tSignContactController.getContacts('', 10, 1, false, null);
        Test.stopTest();

        System.debug('No Facility - Total Records: ' + page.totalRecords);
    }

    @isTest
    static void testGetContacts_Individual() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        org.Account_Type__c = 'Individual';
        update org;
        setRunningUserOrg(org.Id);

        // Ensure we populate the Address components so the Formula field (Address_Data__c) has a value to search
        insert new TSign_Contact__c(
            First_Name__c = 'John',
            Last_Name__c = 'Doe',
            Email__c = 'john.' + DateTime.now().getTime() + '@example.com',
            Address__Street__s = '123 Test St'
        );

        Test.startTest();
        tSignContactController.ContactPage page = 
            tSignContactController.getContacts('John', 10, 1, false, null);
        Test.stopTest();

        System.debug('Individual - Total Records: ' + page.totalRecords);
    }

    @isTest
    static void testGetContacts_Business() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        setRunningUserOrg(org.Id);

        TSign_Facility__c fac = new TSign_Facility__c(
            Name = 'Test Facility',
            TSign_Organisation__c = org.Id,
            Active__c = true
        );
        insert fac;

        insert new TSign_Contact__c(
            First_Name__c = 'Jane',
            Last_Name__c = 'Doe',
            Email__c = 'jane.' + DateTime.now().getTime() + '@example.com',
            TSign_Facility__c = fac.Id,
            Address__Street__s = '456 Test Ave'
        );

        Test.startTest();
        tSignContactController.ContactPage page = 
            tSignContactController.getContacts('Jane', 10, 1, false, fac.Id);
        Test.stopTest();

        System.debug('Business - Total Records: ' + page.totalRecords);
    }

    @isTest
    static void testSaveContact_Individual() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        org.Account_Type__c = 'Individual';
        update org;
        setRunningUserOrg(org.Id);

        TSign_Contact__c newContact = new TSign_Contact__c(
            First_Name__c = 'Alice',
            Last_Name__c = 'Smith',
            Email__c = 'alice.' + DateTime.now().getTime() + '@example.com'
        );

        tSignContactController.AddressInput addr = new tSignContactController.AddressInput();
        addr.street = '123 Main St';
        addr.city = 'Sydney';
        addr.stateCode = 'NSW';
        addr.countryCode = 'AU';
        addr.postalCode = '2000';

        Test.startTest();
        Id contactId = tSignContactController.saveContact(newContact, addr);
        Test.stopTest();

        System.debug('Individual Contact Saved: ' + contactId);
    }

    @isTest
    static void testSaveContact_Business() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        setRunningUserOrg(org.Id);

        TSign_Facility__c fac = new TSign_Facility__c(
            Name = 'Test Facility',
            TSign_Organisation__c = org.Id,
            Active__c = true
        );
        insert fac;

        TSign_Contact__c newContact = new TSign_Contact__c(
            First_Name__c = 'Bob',
            Last_Name__c = 'Jones',
            Email__c = 'bob.' + DateTime.now().getTime() + '@example.com',
            TSign_Facility__c = fac.Id
        );

        Test.startTest();
        Id contactId = tSignContactController.saveContact(newContact, null);
        Test.stopTest();

        System.debug('Business Contact Saved: ' + contactId);
    }

    @isTest
    static void testSaveContact_Update() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        org.Account_Type__c = 'Individual';
        update org;
        setRunningUserOrg(org.Id);

        TSign_Contact__c existingContact = new TSign_Contact__c(
            First_Name__c = 'Charlie',
            Last_Name__c = 'Brown',
            Email__c = 'charlie.' + DateTime.now().getTime() + '@example.com'
        );
        insert existingContact;

        existingContact.First_Name__c = 'Chuck';

        Test.startTest();
        Id updatedId = tSignContactController.saveContact(existingContact, null);
        Test.stopTest();

        System.debug('Contact Updated: ' + updatedId);
    }

    @isTest
    static void testSaveContact_ErrorPaths() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c LIMIT 1];
        setRunningUserOrg(org.Id);

        // 1. Missing Facility (Business)
        TSign_Contact__c noFacContact = new TSign_Contact__c(
            First_Name__c = 'Error',
            Last_Name__c = 'Test',
            Email__c = 'error.' + DateTime.now().getTime() + '@example.com'
        );

        Test.startTest();
        try {
            tSignContactController.saveContact(noFacContact, null);
        } catch (Exception e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }

        // 2. Duplicate Email
        String dupEmail = 'duplicate.' + DateTime.now().getTime() + '@example.com';
        insert new TSign_Contact__c(
            First_Name__c = 'Original',
            Last_Name__c = 'Dup',
            Email__c = dupEmail
        );

        TSign_Contact__c dupeContact = new TSign_Contact__c(
            First_Name__c = 'Copy',
            Last_Name__c = 'Cat',
            Email__c = dupEmail
        );

        try {
            tSignContactController.saveContact(dupeContact, null);
        } catch (Exception e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    @isTest
    static void testSetArchived() {
        TSign_Contact__c contact = new TSign_Contact__c(
            First_Name__c = 'Archive',
            Last_Name__c = 'Test',
            Email__c = 'archive.' + DateTime.now().getTime() + '@example.com'
        );
        insert contact;

        Test.startTest();
        tSignContactController.setArchived(contact.Id, true);
        tSignContactController.setArchived(contact.Id, false);
        Test.stopTest();
    }

    @isTest
    static void testHelpers() {
        Test.startTest();
        tSignContactController.buildContactName(' John ', ' Doe ');
        tSignContactController.buildContactName(null, 'Doe');
        tSignContactController.buildContactName('A very long first name that exceeds the character limit', 'And a very long last name');
        
        try {
            throw tSignContactController.auraError('Test Aura Error');
        } catch (Exception e) {}

        try {
            throw new DmlException('Test Dml Error');
        } catch (Exception e) {
            tSignContactController.logError(e);
        }

        tSignContactController.getCurrentUserOrganisation();
        Test.stopTest();
    }
}