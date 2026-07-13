@IsTest
private class LimitCheckServiceTest {

    @IsTest
    static void testAllMethods_StartPlan() {

        TestDataFactory.createBaseData();

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];

        org.Organization_Tier__c = 'Start';
        update org;

        User u = [
            SELECT Id
            FROM User
            WHERE Organization_Name__c = 'Ashfield Consultants'
            LIMIT 1
        ];

        System.runAs(u) {

            Test.startTest();

            Boolean staffLimit = LimitCheckService.isStaffLimitReached();
            Integer staffRemaining = LimitCheckService.getRemainingStaffSlots();

            Boolean facLimit = LimitCheckService.isFacilityLimitReached();
            Integer facRemaining = LimitCheckService.getRemainingFacilitySlots();

            Boolean partLimit = LimitCheckService.isParticipantLimitReached();
            Integer partRemaining = LimitCheckService.getRemainingParticipantSlots();

            Boolean canAdd = LimitCheckService.canAddAgreement();
            Boolean isStart = LimitCheckService.isStartPlan();

            Test.stopTest();
        }
    }

    @IsTest
    static void testAllMethods_UnlimitedPlan() {

        TestDataFactory.createBaseData();

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];

        org.Organization_Tier__c = 'Start'; // not Start → unlimited
        update org;

        User u = [
            SELECT Id
            FROM User
            WHERE Organization_Name__c = 'Ashfield Consultants'
            LIMIT 1
        ];

        System.runAs(u) {

            Test.startTest();

            LimitCheckService.isStaffLimitReached();
            LimitCheckService.getRemainingStaffSlots();

            LimitCheckService.isFacilityLimitReached();
            LimitCheckService.getRemainingFacilitySlots();

            LimitCheckService.isParticipantLimitReached();
            LimitCheckService.getRemainingParticipantSlots();

            LimitCheckService.isStartPlan();

            Test.stopTest();
        }
    }

    @IsTest
    static void testNoOrgScenario() {

        Profile p = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];

        String unique = String.valueOf(System.currentTimeMillis());

        User u = new User(
            Alias = 'nouser',
            Email = 'nouser' + unique + '@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'NoOrg',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'nouser' + unique + '@test.com'
        );

        insert u;

        System.runAs(u) {

            Test.startTest();

            LimitCheckService.isStaffLimitReached();
            LimitCheckService.getRemainingStaffSlots();

            LimitCheckService.isFacilityLimitReached();
            LimitCheckService.getRemainingFacilitySlots();

            LimitCheckService.isParticipantLimitReached();
            LimitCheckService.getRemainingParticipantSlots();

            LimitCheckService.canAddAgreement();
            LimitCheckService.isStartPlan();

            Test.stopTest();
        }
    }
}