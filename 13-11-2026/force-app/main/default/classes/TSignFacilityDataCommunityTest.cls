@isTest
public class TSignFacilityDataCommunityTest {

    // ------------------------------------------------------------------
    // Helper: Create a TSign Organisation
    // ------------------------------------------------------------------
    private static TSign_Organisation__c createOrg(String name) {
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = name + ' ' + DateTime.now().getTime(),
            Account_Type__c = 'Organisation',
            Active__c = true,
            Email__c = 'org.' + DateTime.now().getTime() + '@example.com'
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
    // TEST 1: getFacilities - Happy Path with Pagination & Search
    // ==================================================================
    @isTest
    static void testGetFacilities() {
        TSign_Organisation__c org = createOrg('Test Org');
        setRunningUserOrg(org.Id);

        // Create 5 test facilities
        List<TSign_Facility__c> facilities = new List<TSign_Facility__c>();
        for (Integer i = 1; i <= 5; i++) {
            facilities.add(new TSign_Facility__c(
                Name = 'Facility ' + i,
                TSign_Organisation__c = org.Id,
                Active__c = true,
                Email__c = 'fac' + i + '@example.com'
            ));
        }
        insert facilities;

        Test.startTest();
        // Fetch Page 1, Size 3, Search for 'Facility'
        TSignFacilityDataCommunity.FacilityWrapper wrapper = 
            TSignFacilityDataCommunity.getFacilities('Facility', 3, 1);
        Test.stopTest();

        System.debug('getFacilities - Total Records: ' + wrapper.totalRecords);
        System.debug('getFacilities - Fetched on Page 1: ' + wrapper.facilities.size());
    }

    // ==================================================================
    // TEST 2: getFacilities - No Org Linked (Exception Path)
    // ==================================================================
    @isTest
    static void testGetFacilities_NoOrg() {
        setRunningUserOrg(null);

        Test.startTest();
        try {
            TSignFacilityDataCommunity.getFacilities('', 10, 1);
            System.debug('Error: Did not throw expected exception.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception for getFacilities: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 3: saveFacility - Insert Happy Path
    // ==================================================================
    @isTest
    static void testSaveFacility_Insert() {
        TSign_Organisation__c org = createOrg('Insert Org');
        setRunningUserOrg(org.Id);

        TSign_Facility__c newFac = new TSign_Facility__c(
            Name = 'New Insert Facility',
            Email__c = 'newinsert@example.com',
            Phone__c = '1234567890'
        );

        Test.startTest();
        TSignFacilityDataCommunity.saveFacility(newFac, null);
        Test.stopTest();

        System.debug('saveFacility Insert - Facility Id: ' + newFac.Id);
    }

    // ==================================================================
    // TEST 4: saveFacility - Update Happy Path
    // ==================================================================
    @isTest
    static void testSaveFacility_Update() {
        TSign_Organisation__c org = createOrg('Update Org');
        setRunningUserOrg(org.Id);

        TSign_Facility__c existingFac = new TSign_Facility__c(
            Name = 'Existing Facility',
            TSign_Organisation__c = org.Id,
            Active__c = true
        );
        insert existingFac;

        // Modify the facility
        existingFac.Name = 'Updated Facility Name';

        Test.startTest();
        TSignFacilityDataCommunity.saveFacility(existingFac, null);
        Test.stopTest();

        System.debug('saveFacility Update - Facility Id: ' + existingFac.Id);
    }

    // ==================================================================
    // TEST 5: saveFacility - Null Facility (Exception Path)
    // ==================================================================
    @isTest
    static void testSaveFacility_NullFacility() {
        Test.startTest();
        try {
            TSignFacilityDataCommunity.saveFacility(null, null);
            System.debug('Error: Did not throw expected exception.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception for null facility: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 6: saveFacility - Blank Name (Exception Path)
    // ==================================================================
    @isTest
    static void testSaveFacility_BlankName() {
        TSign_Facility__c fac = new TSign_Facility__c(Name = '');

        Test.startTest();
        try {
            TSignFacilityDataCommunity.saveFacility(fac, null);
            System.debug('Error: Did not throw expected exception.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception for blank name: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 7: saveFacility - No Org Linked (Exception Path)
    // ==================================================================
    @isTest
    static void testSaveFacility_NoOrg() {
        setRunningUserOrg(null);
        TSign_Facility__c fac = new TSign_Facility__c(Name = 'No Org Facility');

        Test.startTest();
        try {
            TSignFacilityDataCommunity.saveFacility(fac, null);
            System.debug('Error: Did not throw expected exception.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception for no org: ' + e.getMessage());
        }
        Test.stopTest();
    }

    // ==================================================================
    // TEST 8: saveFacility - Update Facility from Different Org (Exception Path)
    // ==================================================================
    @isTest
    static void testSaveFacility_UnauthorizedUpdate() {
        TSign_Organisation__c org1 = createOrg('Org 1');
        TSign_Organisation__c org2 = createOrg('Org 2');
        
        // Running user is linked to Org 1
        setRunningUserOrg(org1.Id);

        // Create a facility belonging to Org 2
        TSign_Facility__c otherOrgFac = new TSign_Facility__c(
            Name = 'Other Org Facility',
            TSign_Organisation__c = org2.Id,
            Active__c = true
        );
        insert otherOrgFac;

        // Try to update Org 2's facility while logged in as Org 1
        otherOrgFac.Name = 'Attempted Hack';

        Test.startTest();
        try {
            TSignFacilityDataCommunity.saveFacility(otherOrgFac, null);
            System.debug('Error: Did not throw expected exception.');
        } catch (AuraHandledException e) {
            System.debug('Caught expected exception for unauthorized update: ' + e.getMessage());
        }
        Test.stopTest();
    }
}