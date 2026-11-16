@IsTest
private class DashboardControllerTest {

    @IsTest
    static void testGetStats() {

        TestDataFactory.createBaseData();

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];

        org.Organization_Tier__c = 'Start';
       
        org.Billing_Type__c = 'Monthly';
        org.Start_Date__c = Date.today().addDays(-10);
        org.End_Date__c = Date.today().addDays(20);
        org.Storage_Limit__c = 500;
        update org;

        User u = [
            SELECT Id
            FROM User
            WHERE Organization_Name__c = 'Ashfield Consultants'
            LIMIT 1
        ];

        System.runAs(u) {
            Test.startTest();
            DashboardController.StatsWrapper result = DashboardController.getStats();
            Test.stopTest();
        }
    }

    @IsTest
    static void testGetStats_NoOrgName() {

        Profile p = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];

        String unique = String.valueOf(System.currentTimeMillis());

        User u = new User(
            Alias = 'testusr',
            Email = 'testuser' + unique + '@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'NoOrg',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'testuser' + unique + '@test.com'
        );

        insert u;

        System.runAs(u) {
            Test.startTest();
            DashboardController.StatsWrapper result = DashboardController.getStats();
            Test.stopTest();
        }
    }
}