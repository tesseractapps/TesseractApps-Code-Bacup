@IsTest
public class Support_ProviderControllerTest {

    @TestSetup
    static void setupData() {

        TestDataFactory.createBaseData();

        Organisation__c org = [
            SELECT Id
            FROM Organisation__c
            LIMIT 1
        ];

        Support_Provider__c provider = new Support_Provider__c(
            Name = 'Test Provider',
            Contact_Email__c = 'provider@test.com',
            Status__c = 'Active',
            Service_Type__c = 'Support Coordination',
            Registration_Number__c = 'REG123',
            Phone__c = '9999999999',
            ABN__c = '12345678901',
            Current_Capacity__c = 'Available',
            Organization__c = org.Id
        );
        insert provider;

        Support_Client__c participant = new Support_Client__c(
            First_Name__c = 'John',
            Last_Name__c = 'Doe',
            Status__c = 'Active',
            Organization__c = org.Id,
            SupportClient_To_Provider__c = provider.Id
        );
        insert participant;
    }

    @IsTest
    static void testSaveProvider() {

        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Map<String,Object> providerData =
                new Map<String,Object>();

            providerData.put('Name', 'New Provider');
            providerData.put('Current_Capacity__c', 'Available');
            providerData.put('Service_Type__c', 'Support Coordination');
            providerData.put('Registration_Number__c', 'REG999');
            providerData.put('ABN__c', '98765432101');
            providerData.put('Contact_Email__c', 'new@test.com');
            providerData.put('Phone__c', '8888888888');
            providerData.put('Status__c', 'Active');
            providerData.put('Industry_Type__c', 'NDIS');

            Test.startTest();

            Id providerId =
                Support_ProviderController.saveProvider(
                    providerData
                );

            // UPDATE FLOW
            providerData.put('Id', providerId);
            providerData.put('Name', 'Updated Provider');

            Support_ProviderController.saveProvider(
                providerData
            );

            Test.stopTest();
        }
    }

    @IsTest
    static void testGetProviders() {

        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Test.startTest();

            Support_ProviderController.getProviders(
                'Support Coordination'
            );

            Support_ProviderController.getProviders(
                null
            );

            Test.stopTest();
        }
    }

    @IsTest
    static void testExceptionMethods() {

        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];

        System.runAs(testUser) {

            Test.startTest();

            try {

                Support_ProviderController.saveProvider(
                    null
                );

            } catch (Exception e) {}

            Test.stopTest();
        }
    }

        @IsTest
    static void testGetDashboardMetrics() {
    
        User testUser = [
            SELECT Id
            FROM User
            WHERE Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
    
        System.runAs(testUser) {
    
            Test.startTest();
    
            Support_ProviderController.getDashboardMetrics();
    
            Test.stopTest();
        }
    }
@IsTest
static void testGetProvidersPaged() {

    User testUser = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    System.runAs(testUser) {

        Test.startTest();

        Support_ProviderController.getProvidersPaged(
            5,
            1,
            'Test'
        );

        Support_ProviderController.getProvidersPaged(
            5,
            1,
            null
        );

        Test.stopTest();
    }
}
}