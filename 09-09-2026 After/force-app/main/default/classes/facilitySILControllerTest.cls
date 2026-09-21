@IsTest
public class facilitySILControllerTest {

    @IsTest
    static void testFetchActiveParticipants() {

        TestDataFactory.createBaseData();

        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

        Test.startTest();

        List<facilitySILController.SelectOptionWrapper> result =
            facilitySILController.fetchActiveParticipants(fac.Id);

        Test.stopTest();
    }

    @IsTest
    static void testFetchServiceTypes() {

        TestDataFactory.createBaseData();

        Test.startTest();

        List<String> types = facilitySILController.fetchServiceTypes();

        Test.stopTest();
    }

    @IsTest
    static void testFetchParticipantNDISCatalogue() {

        TestDataFactory.createBaseData();

        Test.startTest();

        List<NDIS_Support_Catalogue__c> data =
            facilitySILController.fetchParticipantNDISCatalogue(
                'Assistance Animals',
                Date.today()
            );

        Test.stopTest();
    }

    @IsTest
    static void testFetchSILRecords() {

        TestDataFactory.createBaseData();

        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];

        Test.startTest();

        Map<String, Object> result =
            facilitySILController.fetchSILRecords(
                fac.Id,
                10,
                0
            );

        Test.stopTest();
    }

    @IsTest
    static void testSaveSIL_InsertAndFetchById() {

        TestDataFactory.createBaseData();

        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
        NDIS_Support_Catalogue__c cat =
    [SELECT Id, Name, Support_Item_Name__c, Support_Item_Number__c 
     FROM NDIS_Support_Catalogue__c LIMIT 1];

        facilitySILController.SILRequestWrapper req = new facilitySILController.SILRequestWrapper();
        req.amount = 100;
        req.startDate = Date.today();
        req.endDate = Date.today().addDays(10);
        req.frequency = 'Weekly';
        req.invoiceDay = 'Monday';
        req.invoiceAmount = 50;
        req.planType = 'Plan Managed';
        req.serviceType = cat.Name;
        req.state = 'ACT';
        req.entityName = 'Test Entity';
        req.facilityId = fac.Id;
        req.participantId = cli.Id;

        facilitySILController.SelectedItemWrapper item = new facilitySILController.SelectedItemWrapper();
        item.catalogueId = cat.Id;
        item.supportItemName = cat.Support_Item_Name__c;
        item.supportItemNumber = cat.Support_Item_Number__c;

        req.selectedItems = new List<facilitySILController.SelectedItemWrapper>{ item };

        String jsonReq = JSON.serialize(req);

        Test.startTest();

        Id silId = facilitySILController.saveSIL(jsonReq);

        facilitySILController.fetchSILRecordById(silId, 'ACT');

        Test.stopTest();
    }

    @IsTest
    static void testSaveSIL_UpdateFlow() {

        TestDataFactory.createBaseData();

        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
        NDIS_Support_Catalogue__c cat =
    [SELECT Id, Name, Support_Item_Name__c, Support_Item_Number__c 
     FROM NDIS_Support_Catalogue__c LIMIT 1];
        facilitySILController.SILRequestWrapper req = new facilitySILController.SILRequestWrapper();
        req.amount = 100;
        req.startDate = Date.today();
        req.endDate = Date.today().addDays(5);
        req.frequency = 'Weekly';
        req.invoiceDay = 'Monday';
        req.invoiceAmount = 50;
        req.planType = 'Plan Managed';
        req.serviceType = cat.Name;
        req.state = 'ACT';
        req.entityName = 'Test Entity';
        req.facilityId = fac.Id;
        req.participantId = cli.Id;

        facilitySILController.SelectedItemWrapper item = new facilitySILController.SelectedItemWrapper();
        item.catalogueId = cat.Id;
        item.supportItemName = cat.Support_Item_Name__c;
        item.supportItemNumber = cat.Support_Item_Number__c;

        req.selectedItems = new List<facilitySILController.SelectedItemWrapper>{ item };

        String jsonReq = JSON.serialize(req);

        Id silId = facilitySILController.saveSIL(jsonReq);

        req.silId = silId;
        req.amount = 200;

        String updateJson = JSON.serialize(req);

        Test.startTest();

        facilitySILController.saveSIL(updateJson);

        Test.stopTest();
    }
}