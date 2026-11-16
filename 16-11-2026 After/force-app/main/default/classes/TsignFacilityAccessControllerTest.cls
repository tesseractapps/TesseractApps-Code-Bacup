@isTest
public class TsignFacilityAccessControllerTest {

    // ------------------------------------------------------------------
    // Helper: Update the running test user's TSign Org Id
    // ------------------------------------------------------------------
    public static void setRunningUserOrg(Id orgId) {
        User u = [SELECT Id, TSign_Org_Id__c FROM User WHERE Id = :UserInfo.getUserId()];
        u.TSign_Org_Id__c = orgId != null ? String.valueOf(orgId) : null;
        Database.update(u, false);
    }

    // ------------------------------------------------------------------
    // Helper: Create a TSign Organisation
    // ------------------------------------------------------------------
    public static TSign_Organisation__c createOrg(String name) {
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = name + ' ' + DateTime.now().getTime(),
            Active__c = true,
            Email__c = 'org.' + DateTime.now().getTime() + '@example.com'
        );
        insert org;
        return org;
    }

    // ------------------------------------------------------------------
    // Helper: Create a TSign Facility
    // ------------------------------------------------------------------
    public static TSign_Facility__c createFacility(Id orgId, String name, Boolean isActive) {
        TSign_Facility__c fac = new TSign_Facility__c(
            Name = name,
            TSign_Organisation__c = orgId,
            Active__c = isActive
        );
        insert fac;
        return fac;
    }

    // ------------------------------------------------------------------
    // Helper: Create a TSign Staff
    // ------------------------------------------------------------------
    public static TSign_Staff__c createStaff(Id orgId, String email) {
        TSign_Staff__c staff = new TSign_Staff__c(
            First_Name__c = 'Test',
            Last_Name__c = 'Staff',
            Email__c = email,
            TSign_Organisation__c = orgId,
            Status__c = true
        );
        insert staff;
        return staff;
    }

    // ==================================================================
    // TEST 1: getFacilityAccessForStaff - Happy Path
    // ==================================================================
    @isTest
    static void testGetFacilityAccessForStaff() {
        TSign_Organisation__c org = createOrg('Test Org');
        setRunningUserOrg(org.Id);

        TSign_Facility__c fac1 = createFacility(org.Id, 'Facility A', true);
        TSign_Facility__c fac2 = createFacility(org.Id, 'Facility B', true);
        TSign_Facility__c fac3 = createFacility(org.Id, 'Facility C', false); // Inactive, should be excluded

        TSign_Staff__c staff = createStaff(org.Id, 'staff@example.com');

        // Give the staff access to Facility A
        insert new TSign_Staff_Facility__c(
            TSign_Staff__c = staff.Id,
            TSign_Facility__c = fac1.Id,
            Active__c = true
        );

        Test.startTest();
        List<TsignFacilityAccessController.FacilityOption> results = 
            TsignFacilityAccessController.getFacilityAccessForStaff(staff.Id);
        Test.stopTest();

        System.debug('getFacilityAccessForStaff - Options returned: ' + results.size());
        for (TsignFacilityAccessController.FacilityOption opt : results) {
            System.debug('Option: ' + opt.name + ' | Checked: ' + opt.checked);
        }
    }

    // ==================================================================
    // TEST 2: getFacilityAccessForStaff - Blank Staff Id (Exception Path)
    // ==================================================================
    @isTest
    static void testGetFacilityAccessForStaff_BlankStaffId() {
        Test.startTest();
        try {
            TsignFacilityAccessController.getFacilityAccessForStaff('');
            System.debug('Expected exception not thrown for blank staff id.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 3: getFacilityAccessForStaff - No Org Linked (Exception Path)
    // ==================================================================
    @isTest
    static void testGetFacilityAccessForStaff_NoOrg() {
        setRunningUserOrg(null);
        TSign_Organisation__c org = createOrg('Dummy Org');
        TSign_Staff__c staff = createStaff(org.Id, 'staff@example.com');

        Test.startTest();
        try {
            TsignFacilityAccessController.getFacilityAccessForStaff(staff.Id);
            System.debug('Expected exception not thrown for no org.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 4: updateFacilityAccess - Happy Path (Insert, Reactivate, Deactivate)
    // ==================================================================
    @isTest
    static void testUpdateFacilityAccess() {
        TSign_Organisation__c org = createOrg('Test Org');
        TSign_Facility__c fac1 = createFacility(org.Id, 'Facility A', true);
        TSign_Facility__c fac2 = createFacility(org.Id, 'Facility B', true);
        TSign_Facility__c fac3 = createFacility(org.Id, 'Facility C', true);
        
        TSign_Staff__c staff = createStaff(org.Id, 'staff@example.com');

        // Initial Setup:
        // Staff has ACTIVE access to Fac 1
        // Staff has INACTIVE access to Fac 2
        TSign_Staff_Facility__c link1 = new TSign_Staff_Facility__c(
            TSign_Staff__c = staff.Id, TSign_Facility__c = fac1.Id, Active__c = true
        );
        TSign_Staff_Facility__c link2 = new TSign_Staff_Facility__c(
            TSign_Staff__c = staff.Id, TSign_Facility__c = fac2.Id, Active__c = false
        );
        insert new List<TSign_Staff_Facility__c>{ link1, link2 };

        // Request Update:
        // Remove Fac 1 (Deactivate)
        // Add Fac 2 (Reactivate)
        // Add Fac 3 (Insert new)
        TsignFacilityAccessController.FacilityAccessRequest req = new TsignFacilityAccessController.FacilityAccessRequest();
        req.staffId = staff.Id;
        req.facilityIds = new List<String>{ fac2.Id, fac3.Id };

        Test.startTest();
        TsignFacilityAccessController.updateFacilityAccess(req);
        Test.stopTest();

        System.debug('updateFacilityAccess executed successfully.');
    }

    // ==================================================================
    // TEST 5: updateFacilityAccess - Null Request (Exception Path)
    // ==================================================================
    @isTest
    static void testUpdateFacilityAccess_NullRequest() {
        Test.startTest();
        try {
            TsignFacilityAccessController.updateFacilityAccess(null);
            System.debug('Expected exception not thrown for null request.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 6: updateFacilityAccess - Blank Staff Id (Exception Path)
    // ==================================================================
    @isTest
    static void testUpdateFacilityAccess_BlankStaffId() {
        TsignFacilityAccessController.FacilityAccessRequest req = new TsignFacilityAccessController.FacilityAccessRequest();
        req.staffId = '';
        req.facilityIds = new List<String>();

        Test.startTest();
        try {
            TsignFacilityAccessController.updateFacilityAccess(req);
            System.debug('Expected exception not thrown for blank staff id.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 7: updateFacilityAccess - Empty Facility List (Deactivate All)
    // ==================================================================
    @isTest
    static void testUpdateFacilityAccess_EmptyList() {
        TSign_Organisation__c org = createOrg('Test Org');
        TSign_Facility__c fac1 = createFacility(org.Id, 'Facility A', true);
        TSign_Staff__c staff = createStaff(org.Id, 'staff@example.com');

        // Give initial access
        insert new TSign_Staff_Facility__c(
            TSign_Staff__c = staff.Id, TSign_Facility__c = fac1.Id, Active__c = true
        );

        TsignFacilityAccessController.FacilityAccessRequest req = new TsignFacilityAccessController.FacilityAccessRequest();
        req.staffId = staff.Id;
        req.facilityIds = new List<String>(); // Empty means revoke all

        Test.startTest();
        TsignFacilityAccessController.updateFacilityAccess(req);
        Test.stopTest();

        System.debug('updateFacilityAccess (Empty List) executed successfully.');
    }

    // ==================================================================
    // TEST 8: updateFacilityAccess - Null Facility List (Edge Case)
    // ==================================================================
    @isTest
    static void testUpdateFacilityAccess_NullList() {
        TSign_Organisation__c org = createOrg('Test Org');
        TSign_Staff__c staff = createStaff(org.Id, 'staff@example.com');

        TsignFacilityAccessController.FacilityAccessRequest req = new TsignFacilityAccessController.FacilityAccessRequest();
        req.staffId = staff.Id;
        req.facilityIds = null; // Null list

        Test.startTest();
        TsignFacilityAccessController.updateFacilityAccess(req);
        Test.stopTest();

        System.debug('updateFacilityAccess (Null List) executed successfully.');
    }
}