@IsTest
public class ServiceCatalogueBatchTest {

    @TestSetup
    static void setupData() {

        TestDataFactory.createBaseData();

        Facility__c fac = [
            SELECT Id
            FROM Facility__c
            LIMIT 1
        ];

        String currentFY = new ServiceCatalogueBatch().getCurrentFinancialYear();

        NDIS_Support_Catalogue__c currentCatalogue = new NDIS_Support_Catalogue__c(
            Name = 'Current Catalogue',
            Support_Item_Name__c = 'Support Item',
            Support_Item_Number__c = '01_001',
            Financial_Year__c = currentFY,
            Facility__c = fac.Id,
            ACT__c = 100,
            NSW__c = 100,
            NT__c = 100,
            QLD__c = 100,
            SA__c = 100,
            TAS__c = 100,
            VIC__c = 100,
            WA__c = 100
        );

        insert currentCatalogue;

        NDIS_Support_Catalogue__c oldCatalogue = new NDIS_Support_Catalogue__c(
            Name = 'Old Catalogue',
            Support_Item_Name__c = 'Support Item',
            Support_Item_Number__c = '01_001',
            Financial_Year__c = '2024-25',
            Facility__c = fac.Id,
            ACT__c = 100,
            NSW__c = 100,
            NT__c = 100,
            QLD__c = 100,
            SA__c = 100,
            TAS__c = 100,
            VIC__c = 100,
            WA__c = 100
        );

        insert oldCatalogue;

        Service_Catalogue__c sc = new Service_Catalogue__c(
            Facility__c = fac.Id,
            Active__c = true,
            NDIS_Support_Catalogue__c = oldCatalogue.Id
        );

        insert sc;
    }

    @IsTest
    static void testExecuteBatch() {

        Test.startTest();
        Database.executeBatch(new ServiceCatalogueBatch(), 1);
        Test.stopTest();
    }

    @IsTest
    static void testExecuteDirect() {

        List<Service_Catalogue__c> scope = [
            SELECT Id,
                   Facility__c,
                   Active__c,
                   NDIS_Support_Catalogue__c,
                   NDIS_Support_Catalogue__r.Support_Item_Number__c,
                   NDIS_Support_Catalogue__r.Name,
                   NDIS_Support_Catalogue__r.Facility__c,
                   NDIS_Support_Catalogue__r.Facility__r.Name
            FROM Service_Catalogue__c
        ];

        Test.startTest();
        new ServiceCatalogueBatch().execute(null, scope);
        Test.stopTest();
    }

    @IsTest
    static void testExecuteEmptyScope() {

        Test.startTest();
        new ServiceCatalogueBatch().execute(null, new List<Service_Catalogue__c>());
        Test.stopTest();
    }

    @IsTest
    static void testFinancialYear() {

        Test.startTest();
        new ServiceCatalogueBatch().getCurrentFinancialYear();
        Test.stopTest();
    }

    @IsTest
    static void testFinishMethod() {

        Test.startTest();
        new ServiceCatalogueBatch().finish(null);
        Test.stopTest();
    }
}