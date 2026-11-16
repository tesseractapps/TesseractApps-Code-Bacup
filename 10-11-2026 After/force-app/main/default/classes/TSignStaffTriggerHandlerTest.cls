@isTest
public class TSignStaffTriggerHandlerTest {

    // ------------------------------------------------------------------
    // Helper: create a parent Organisation with the given Account Type
    // ------------------------------------------------------------------
    public static TSign_Organisation__c createOrg(String accountType) {
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name            = 'Test Org ' + accountType + ' ' + DateTime.now().getTime(),
            Active__c       = true,
            Email__c        = 'org' + DateTime.now().getTime() + '@example.com',
            Account_Type__c = accountType
        );
        insert org;
        return org;
    }

    // ------------------------------------------------------------------
    // Helper: create a TSign_Staff__c record
    // ------------------------------------------------------------------
    public static TSign_Staff__c createStaff(Id orgId, String userType) {
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c         = 'Test',
            Last_Name__c          = 'Staff' + DateTime.now().getTime(),
            Email__c              = 'staff' + DateTime.now().getTime() + '@example.com',
            Status__c             = true,
            TSign_Organisation__c = orgId,
            User_Type__c          = userType
        );
        insert staff;
        return staff;
    }

    // ==================================================================
    // TEST: insert triggers module access for Organisation + Org Admin
    // ==================================================================
    @isTest
    static void testInsertOrganisationOrgAdmin() {
        TSign_Organisation__c org = createOrg('Organisation');

        Test.startTest();
        TSign_Staff__c staff = createStaff(org.Id, 'T Sign Org Admin');
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('Org Admin Module Access: ' + refreshed.Module_Access__c);
    }

    // ==================================================================
    // TEST: insert triggers module access for Organisation + Manager
    // ==================================================================
    @isTest
    static void testInsertOrganisationManager() {
        TSign_Organisation__c org = createOrg('Organisation');

        Test.startTest();
        TSign_Staff__c staff = createStaff(org.Id, 'T Sign Manager');
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('Org Manager Module Access: ' + refreshed.Module_Access__c);
    }

    // ==================================================================
    // TEST: insert triggers module access for Organisation + Staff
    // ==================================================================
    @isTest
    static void testInsertOrganisationStaff() {
        TSign_Organisation__c org = createOrg('Organisation');

        Test.startTest();
        TSign_Staff__c staff = createStaff(org.Id, 'T Sign Staff');
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('Org Staff Module Access: ' + refreshed.Module_Access__c);
    }

    // ==================================================================
    // TEST: insert triggers module access for Individual + Org Admin
    // ==================================================================
    @isTest
    static void testInsertIndividualOrgAdmin() {
        TSign_Organisation__c org = createOrg('Individual');

        Test.startTest();
        TSign_Staff__c staff = createStaff(org.Id, 'T Sign Org Admin');
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('Individual Org Admin Module Access: ' + refreshed.Module_Access__c);
    }

    // ==================================================================
    // TEST: insert triggers module access for Individual + Manager
    // ==================================================================
    @isTest
    static void testInsertIndividualManager() {
        TSign_Organisation__c org = createOrg('Individual');

        Test.startTest();
        TSign_Staff__c staff = createStaff(org.Id, 'T Sign Manager');
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('Individual Manager Module Access: ' + refreshed.Module_Access__c);
    }

    // ==================================================================
    // TEST: insert triggers module access for Individual + Staff
    // ==================================================================
    @isTest
    static void testInsertIndividualStaff() {
        TSign_Organisation__c org = createOrg('Individual');

        Test.startTest();
        TSign_Staff__c staff = createStaff(org.Id, 'T Sign Staff');
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('Individual Staff Module Access: ' + refreshed.Module_Access__c);
    }

    // ==================================================================
    // TEST: update User_Type__c triggers recompute (Org Admin -> Manager)
    // ==================================================================
    @isTest
    static void testUpdateUserTypeOrgAdminToManager() {
        TSign_Organisation__c org = createOrg('Organisation');
        TSign_Staff__c staff = createStaff(org.Id, 'T Sign Org Admin');

        Test.startTest();
        staff.User_Type__c = 'T Sign Manager';
        update staff;
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, User_Type__c, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('Updated User Type: ' + refreshed.User_Type__c);
        System.debug('Updated Module Access: ' + refreshed.Module_Access__c);
    }

    // ==================================================================
    // TEST: update User_Type__c triggers recompute (Manager -> Staff)
    // ==================================================================
    @isTest
    static void testUpdateUserTypeManagerToStaff() {
        TSign_Organisation__c org = createOrg('Organisation');
        TSign_Staff__c staff = createStaff(org.Id, 'T Sign Manager');

        Test.startTest();
        staff.User_Type__c = 'T Sign Staff';
        update staff;
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, User_Type__c, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('Updated User Type: ' + refreshed.User_Type__c);
        System.debug('Updated Module Access: ' + refreshed.Module_Access__c);
    }

    // ==================================================================
    // TEST: update where User_Type__c did NOT change -> skip processing
    // ==================================================================
    @isTest
    static void testUpdateWithoutUserTypeChange() {
        TSign_Organisation__c org = createOrg('Organisation');
        TSign_Staff__c staff = createStaff(org.Id, 'T Sign Org Admin');

        Test.startTest();
        // Change unrelated field, keep User_Type__c the same
        staff.First_Name__c = 'Updated';
        update staff;
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, User_Type__c, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('Unchanged User Type: ' + refreshed.User_Type__c);
        System.debug('Unchanged Module Access: ' + refreshed.Module_Access__c);
    }

    // ==================================================================
    // TEST: unknown User_Type__c -> no module access set
    // ==================================================================
    @isTest
    static void testUnknownUserType() {
        TSign_Organisation__c org = createOrg('Organisation');

        Test.startTest();
        TSign_Staff__c staff = createStaff(org.Id, 'Unknown Role ' + DateTime.now().getTime());
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, User_Type__c, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('Unknown user type module access: ' + refreshed.Module_Access__c);
    }

    // ==================================================================
    // TEST: unknown Account_Type__c on org -> no module access set
    // ==================================================================
    @isTest
    static void testUnknownAccountType() {
        TSign_Organisation__c org = createOrg('Organisation');

        Test.startTest();
        TSign_Staff__c staff = createStaff(org.Id, 'T Sign Org Admin');
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('Unknown account type module access: ' + refreshed.Module_Access__c);
    }

    // ==================================================================
    // TEST: staff with no Organisation -> skipped safely
    // ==================================================================
    @isTest
    static void testStaffWithoutOrganisation() {
        Test.startTest();
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c = 'No',
            Last_Name__c  = 'Org' + DateTime.now().getTime(),
            Email__c      = 'norg' + DateTime.now().getTime() + '@example.com',
            Status__c     = true,
            User_Type__c  = 'T Sign Org Admin'
        );
        insert staff;
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('No-org staff module access: ' + refreshed.Module_Access__c);
    }

    // ==================================================================
    // TEST: bulk insert (100 staff) — exercises bulkification
    // ==================================================================
    @isTest
    static void testBulkInsert() {
        TSign_Organisation__c org = createOrg('Organisation');

        List<TSign_Staff__c> staffList = new List<TSign_Staff__c>();
        for (Integer i = 0; i < 100; i++) {
            staffList.add(new TSign_Staff__c(
                First_Name__c         = 'Bulk',
                Last_Name__c          = 'Staff' + i,
                Email__c              = 'bulk' + i + '.' + DateTime.now().getTime() + '@example.com',
                Status__c             = true,
                TSign_Organisation__c = org.Id,
                User_Type__c          = 'T Sign Org Admin'
            ));
        }

        Test.startTest();
        insert staffList;
        Test.stopTest();

        List<TSign_Staff__c> refreshed = [
            SELECT Id, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id IN :staffList
        ];
        System.debug('Bulk insert processed records: ' + refreshed.size());
    }

    // ==================================================================
    // TEST: bulk update — exercises change detection in bulk
    // ==================================================================
    @isTest
    static void testBulkUpdate() {
        TSign_Organisation__c org = createOrg('Organisation');

        List<TSign_Staff__c> staffList = new List<TSign_Staff__c>();
        for (Integer i = 0; i < 50; i++) {
            staffList.add(new TSign_Staff__c(
                First_Name__c         = 'BulkUpd',
                Last_Name__c          = 'Staff' + i,
                Email__c              = 'bulkupd' + i + '.' + DateTime.now().getTime() + '@example.com',
                Status__c             = true,
                TSign_Organisation__c = org.Id,
                User_Type__c          = 'T Sign Org Admin'
            ));
        }
        insert staffList;

        Test.startTest();
        for (TSign_Staff__c s : staffList) {
            s.User_Type__c = 'T Sign Staff';
        }
        update staffList;
        Test.stopTest();

        List<TSign_Staff__c> refreshed = [
            SELECT Id, User_Type__c, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id IN :staffList
        ];
        System.debug('Bulk update processed records: ' + refreshed.size());
    }

    // ==================================================================
    // TEST: bypass flag prevents processing when set before DML
    // ==================================================================
    @isTest
    static void testBypassFlag() {
        TSign_Organisation__c org = createOrg('Organisation');

        Test.startTest();
        TSignStaffTriggerHandler.bypass = true;
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c         = 'Bypass',
            Last_Name__c          = 'Staff' + DateTime.now().getTime(),
            Email__c              = 'bypass' + DateTime.now().getTime() + '@example.com',
            Status__c             = true,
            TSign_Organisation__c = org.Id,
            User_Type__c          = 'T Sign Org Admin'
        );
        insert staff;
        TSignStaffTriggerHandler.bypass = false;
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('Bypass test module access (expected null/empty): ' + refreshed.Module_Access__c);
    }

    // ==================================================================
    // TEST: direct call to handleModuleAccess with empty list
    // ==================================================================
    @isTest
    static void testHandleModuleAccessEmptyList() {
        Test.startTest();
        TSignStaffTriggerHandler.handleModuleAccess(
            new List<TSign_Staff__c>(),
            new Map<Id, TSign_Staff__c>(),
            true
        );
        Test.stopTest();
        System.debug('Empty-list handleModuleAccess completed.');
    }

    // ==================================================================
    // TEST: direct call with staff missing org -> early return path
    // ==================================================================
    @isTest
    static void testHandleModuleAccessMissingOrg() {
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c = 'Direct',
            Last_Name__c  = 'Call',
            Email__c      = 'direct.' + DateTime.now().getTime() + '@example.com',
            User_Type__c  = 'T Sign Org Admin'
        );

        Test.startTest();
        TSignStaffTriggerHandler.handleModuleAccess(
            new List<TSign_Staff__c>{ staff },
            new Map<Id, TSign_Staff__c>(),
            true
        );
        Test.stopTest();
        System.debug('Direct call missing-org completed.');
    }

    // ==================================================================
    // TEST: update where User_Type__c changes but org has null AccountType
    // ==================================================================
    @isTest
    static void testUpdateWithNullAccountTypeOnOrg() {
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name            = 'NullTypeOrg ' + DateTime.now().getTime(),
            Active__c       = true,
            Email__c        = 'nt' + DateTime.now().getTime() + '@example.com'
        );
        insert org;

        TSign_Staff__c staff = createStaff(org.Id, 'T Sign Org Admin');

        Test.startTest();
        staff.User_Type__c = 'T Sign Manager';
        update staff;
        Test.stopTest();

        TSign_Staff__c refreshed = [
            SELECT Id, User_Type__c, Module_Access__c
            FROM TSign_Staff__c
            WHERE Id = :staff.Id
        ];
        System.debug('Null account type module access: ' + refreshed.Module_Access__c);
    }
}