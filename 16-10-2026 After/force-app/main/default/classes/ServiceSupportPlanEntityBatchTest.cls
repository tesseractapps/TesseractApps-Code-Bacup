@IsTest
public class ServiceSupportPlanEntityBatchTest {

    @TestSetup
    static void setupData() {
        TestDataFactory.createBaseData();
    }

    @IsTest
    static void testTesseractSystem() {

        Organisation__c org = [
            SELECT Id, Accounting_Services__c
            FROM Organisation__c
            LIMIT 1
        ];

        org.Accounting_Services__c = 'Tesseract System';
        update org;

        Services_and_Support_Plan__c service = [
            SELECT
                Id,
                Funds_Tracker__c,
                Service_Type__c,
                Date_of_Service__c,
                Entity_Profile__c,
                Xero_Entity__c,
                SIL_Service__c,
                Status__c,
                ShiftwithStaff__r.Shift_Facility__r.Organisation__c,
                ShiftwithStaff__r.Add_Shift__r.Facility__r.Organisation__c
            FROM Services_and_Support_Plan__c
            LIMIT 1
        ];

        List<ClientFundTrackerJN__c> oldCfts = [
            SELECT Id
            FROM ClientFundTrackerJN__c
            WHERE
                Funds_Tracker__c = :service.Funds_Tracker__c
                AND NDIS_Support_Catalogue__c = :service.Service_Type__c
        ];

        if (!oldCfts.isEmpty()) {
            delete oldCfts;
        }

        Entity_Profile__c entityProfile = [
            SELECT Id
            FROM Entity_Profile__c
            WHERE First_Name__c != null
            LIMIT 1
        ];

        Client__c client = [
            SELECT Id
            FROM Client__c
            LIMIT 1
        ];

        ClientFundTrackerJN__c cft =
            new ClientFundTrackerJN__c(
                Participant__c = client.Id,
                Funds_Tracker__c = service.Funds_Tracker__c,
                NDIS_Support_Catalogue__c = service.Service_Type__c,
                Amount__c = 500,
                Entity_Profile__c = entityProfile.Id
            );

        insert cft;

        Test.startTest();

        Database.executeBatch(
            new ServiceSupportPlanEntityBatch(),
            1
        );

        Test.stopTest();
    }

    @IsTest
    static void testXero() {

        Organisation__c org = [
            SELECT Id, Accounting_Services__c
            FROM Organisation__c
            LIMIT 1
        ];

        org.Accounting_Services__c = 'Xero';
        update org;

        Services_and_Support_Plan__c service = [
            SELECT
                Id,
                Funds_Tracker__c,
                Service_Type__c,
                Date_of_Service__c,
                Entity_Profile__c,
                Xero_Entity__c,
                SIL_Service__c,
                Status__c,
                ShiftwithStaff__r.Shift_Facility__r.Organisation__c,
                ShiftwithStaff__r.Add_Shift__r.Facility__r.Organisation__c
            FROM Services_and_Support_Plan__c
            LIMIT 1
        ];

        List<ClientFundTrackerJN__c> oldCfts = [
            SELECT Id
            FROM ClientFundTrackerJN__c
            WHERE
                Funds_Tracker__c = :service.Funds_Tracker__c
                AND NDIS_Support_Catalogue__c = :service.Service_Type__c
        ];

        if (!oldCfts.isEmpty()) {
            delete oldCfts;
        }

        Xero_Entity__c xeroEntity = [
            SELECT Id
            FROM Xero_Entity__c
            LIMIT 1
        ];

        Client__c client = [
            SELECT Id
            FROM Client__c
            LIMIT 1
        ];

        ClientFundTrackerJN__c cft =
            new ClientFundTrackerJN__c(
                Participant__c = client.Id,
                Funds_Tracker__c = service.Funds_Tracker__c,
                NDIS_Support_Catalogue__c = service.Service_Type__c,
                Amount__c = 500,
                Xero_Entity__c = xeroEntity.Id
            );

        insert cft;

        Test.startTest();

        Database.executeBatch(
            new ServiceSupportPlanEntityBatch(),
            1
        );

        Test.stopTest();
    }

    @IsTest
    static void testMYOB() {

        Organisation__c org = [
            SELECT Id, Accounting_Services__c
            FROM Organisation__c
            LIMIT 1
        ];

        org.Accounting_Services__c = 'MYOB';
        update org;

        Services_and_Support_Plan__c service = [
            SELECT
                Id,
                Funds_Tracker__c,
                Service_Type__c,
                Date_of_Service__c,
                Entity_Profile__c,
                Xero_Entity__c,
                SIL_Service__c,
                Status__c,
                ShiftwithStaff__r.Shift_Facility__r.Organisation__c,
                ShiftwithStaff__r.Add_Shift__r.Facility__r.Organisation__c
            FROM Services_and_Support_Plan__c
            LIMIT 1
        ];

        List<ClientFundTrackerJN__c> oldCfts = [
            SELECT Id
            FROM ClientFundTrackerJN__c
            WHERE
                Funds_Tracker__c = :service.Funds_Tracker__c
                AND NDIS_Support_Catalogue__c = :service.Service_Type__c
        ];

        if (!oldCfts.isEmpty()) {
            delete oldCfts;
        }

        Xero_Entity__c xeroEntity = [
            SELECT Id
            FROM Xero_Entity__c
            LIMIT 1
        ];

        Client__c client = [
            SELECT Id
            FROM Client__c
            LIMIT 1
        ];

        ClientFundTrackerJN__c cft =
            new ClientFundTrackerJN__c(
                Participant__c = client.Id,
                Funds_Tracker__c = service.Funds_Tracker__c,
                NDIS_Support_Catalogue__c = service.Service_Type__c,
                Amount__c = 500,
                Xero_Entity__c = xeroEntity.Id
            );

        insert cft;

        Test.startTest();

        Database.executeBatch(
            new ServiceSupportPlanEntityBatch(),
            1
        );

        Test.stopTest();
    }

    @IsTest
    static void testBlankAccountingService() {

        Organisation__c org = [
            SELECT Id, Accounting_Services__c
            FROM Organisation__c
            LIMIT 1
        ];

        org.Accounting_Services__c = null;
        update org;

        Test.startTest();

        Database.executeBatch(
            new ServiceSupportPlanEntityBatch(),
            1
        );

        Test.stopTest();
    }

    @IsTest
    static void testFinish() {

        ServiceSupportPlanEntityBatch batch =
            new ServiceSupportPlanEntityBatch();

        Test.startTest();

        batch.finish(null);

        Test.stopTest();
    }
}