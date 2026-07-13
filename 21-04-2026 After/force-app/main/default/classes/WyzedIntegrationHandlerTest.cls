@isTest
public class WyzedIntegrationHandlerTest {

    static User createUser(String orgName) {

        Profile p = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];

        User u = new User(
            Alias = 'testusr',
            Email = 'testuser@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Test',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'testuser' + System.currentTimeMillis() + '@test.com',
            Organization_Name__c = orgName
        );
        insert u;

        return u;
    }

    static Organisation__c createOrg() {

        List<String> picklistRoles = new List<String>{'Admin','AIN'};
        String role1 = picklistRoles[0];
        String role2 = picklistRoles[1];

        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
        org.ABN__c='11234567891';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='dsfdsfsd@gmail.com';
        org.Bank__c='Bank Test';
        org.BSB__c='BSB Test';
        org.Account_Name__c='Test Account';
        org.Account_Number__c='1111111111';
        org.Description__c='test Desc';
        org.Address_Latest__Street__s='101';
        org.Address_Latest__City__s='Himas Waterhen';
        org.Address_Latest__PostalCode__s='2060';
        org.Address_Latest__CountryCode__s='AU';
        org.Address_Latest__StateCode__s='NSW';
        org.NDIS_Provider__c='12341234565';
        org.BMSI_Identifier__c ='TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        org.Roles__c = role1 + ';' + role2;

        // 🔥 REQUIRED FOR YOUR CLASS
        org.Wyzed_SSO_Secret__c = 'secret123';
        org.Wyzed_SSO_URL__c = 'https://test.com/sso';
        org.Wyzed_Redirect_URL__c = 'https://test.com/redirect';

        insert org;

        return org;
    }

    @isTest
    static void testEncodeJWT() {

        Organisation__c org = createOrg();
        User u = createUser(org.Name);

        System.runAs(u) {
            String token = WyzedIntegrationHandler.encodeJWT(
                '123',
                'John',
                'Doe',
                'john@test.com',
                true
            );
        }
    }

    @isTest
    static void testRedirectToWyzedSSO() {

        Organisation__c org = createOrg();
        User u = createUser(org.Name);

        System.runAs(u) {
            String url = WyzedIntegrationHandler.redirectToWyzedSSO(
                '123',
                'John',
                'Doe',
                'john@test.com',
                true
            );
        }
    }
}