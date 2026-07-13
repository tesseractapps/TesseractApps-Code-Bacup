@IsTest
private class MobileStaffDocumentsAPI_Test {

    @IsTest
    static void testGetStaffDocuments_FullCoverage() {

        // Create full base data
        TestDataFactory.createBaseData();

        // Get created user
        User u = [SELECT Id, Email FROM User 
                  WHERE Email = 'manualtesting.20294637@hotmail.com' 
                  LIMIT 1];

        // Get created staff
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];

        // Create additional Child_Staff__c records for coverage
        List<Child_Staff__c> extraDocs = new List<Child_Staff__c>();

        Date todayDate = Date.today();

        extraDocs.add(new Child_Staff__c(
            Staff__c = staff.Id,
            Document_Type__c = 'Police Check',
            Status__c = 'Approved',
            Expiry_Date__c = todayDate.addDays(40),
            View_File__c = 'url1'
        ));

        extraDocs.add(new Child_Staff__c(
            Staff__c = staff.Id,
            Document_Type__c = 'First Aid',
            Status__c = 'Pending',
            Expiry_Date__c = todayDate.addDays(10),
            View_File__c = 'url2'
        ));

        extraDocs.add(new Child_Staff__c(
            Staff__c = staff.Id,
            Document_Type__c = 'Certification',
            Status__c = 'Rejected',
            Expiry_Date__c = todayDate.addDays(-5),
            View_File__c = 'url3'
        ));

        extraDocs.add(new Child_Staff__c(
            Staff__c = staff.Id,
            Document_Type__c = null,
            Status__c = null,
            Expiry_Date__c = null,
            View_File__c = 'url4'
        ));

        insert extraDocs;

        System.runAs(u) {

            RestRequest req = new RestRequest();
            req.requestUri = '/services/apexrest/staffDocuments';
            req.httpMethod = 'GET';

            RestResponse res = new RestResponse();

            RestContext.request = req;
            RestContext.response = res;

            Test.startTest();
            MobileStaffDocumentsAPI.getStaffDocuments();
            Test.stopTest();
        }
    }

@IsTest
static void testGetStaffDocuments_ExceptionHandling() {

    // Ensure base data exists (creates active user)
    TestDataFactory.createBaseData();

    User u = [
        SELECT Id, IsActive 
        FROM User 
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(u) {

        RestRequest req = new RestRequest();
        req.requestUri = '/services/apexrest/staffDocuments';
        req.httpMethod = 'GET';

        RestResponse res = new RestResponse();

        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        MobileStaffDocumentsAPI.getStaffDocuments();
        Test.stopTest();
    }
}
}