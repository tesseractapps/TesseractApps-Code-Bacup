@IsTest
public class MobileAppReimbursementsTransportAPITest {

    @IsTest
    static void testGetShiftData_Success() {

        // 🔹 Create base data
        TestDataFactory.createBaseData(); // :contentReference[oaicite:0]{index=0}

        // Get any ShiftwithStaff record
        ShiftwithStaff__c sws = [
            SELECT Id 
            FROM ShiftwithStaff__c 
            LIMIT 1
        ];

        // 🔹 Prepare REST request
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();

        req.requestURI = '/services/apexrest/ReimbursementsTransportAPI/';
        req.httpMethod = 'GET';
        req.addParameter('shiftwithstaffId', sws.Id);

        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        MobileAppReimbursementsTransportAPI.getShiftData(); // :contentReference[oaicite:1]{index=1}
        Test.stopTest();


    }

    @IsTest
    static void testGetShiftData_MissingParam() {

        // 🔹 Prepare REST request WITHOUT param
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();

        req.requestURI = '/services/apexrest/ReimbursementsTransportAPI/';
        req.httpMethod = 'GET';

        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        MobileAppReimbursementsTransportAPI.getShiftData();
        Test.stopTest();
    }

    @IsTest
    static void testGetShiftData_NoTransportRecords() {

        TestDataFactory.createBaseData();

        // Pick ShiftwithStaff
        ShiftwithStaff__c sws = [
            SELECT Id 
            FROM ShiftwithStaff__c 
            LIMIT 1
        ];

        // Delete transport-related records to hit branch
        delete [SELECT Id FROM ClientFundTrackerJN__c];

        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();

        req.requestURI = '/services/apexrest/ReimbursementsTransportAPI/';
        req.httpMethod = 'GET';
        req.addParameter('shiftwithstaffId', sws.Id);

        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        MobileAppReimbursementsTransportAPI.getShiftData();
        Test.stopTest();

   
    }

    @IsTest
    static void testGetRateByState_AllBranches() {

        // 🔹 Create catalogue with all fields populated
        NDIS_Support_Catalogue__c cat = new NDIS_Support_Catalogue__c(
            ACT__c = 10,
            NSW__c = 20,
            QLD__c = 30,
            VIC__c = 40,
            WA__c  = 50,
            SA__c  = 60,
            TAS__c = 70,
            NT__c  = 80,
            Remote__c = 90,
            Very_Remote__c = 100
        );

        // 🔹 Call method for each branch
        Decimal actVal = MobileAppReimbursementsTransportAPI.getRateByState(cat, 'ACT');
        Decimal nswVal = MobileAppReimbursementsTransportAPI.getRateByState(cat, 'NSW');
        Decimal qldVal = MobileAppReimbursementsTransportAPI.getRateByState(cat, 'QLD');
        Decimal vicVal = MobileAppReimbursementsTransportAPI.getRateByState(cat, 'VIC');
        Decimal waVal  = MobileAppReimbursementsTransportAPI.getRateByState(cat, 'WA');
        Decimal saVal  = MobileAppReimbursementsTransportAPI.getRateByState(cat, 'SA');
        Decimal tasVal = MobileAppReimbursementsTransportAPI.getRateByState(cat, 'TAS');
        Decimal ntVal  = MobileAppReimbursementsTransportAPI.getRateByState(cat, 'NT');

        Decimal remoteVal = MobileAppReimbursementsTransportAPI.getRateByState(cat, 'REMOTE');
        Decimal veryRemoteVal = MobileAppReimbursementsTransportAPI.getRateByState(cat, 'VERY_REMOTE');

        Decimal nullVal = MobileAppReimbursementsTransportAPI.getRateByState(cat, 'UNKNOWN');

    
}
}