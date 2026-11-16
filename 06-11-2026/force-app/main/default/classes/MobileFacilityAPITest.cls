@IsTest
public class MobileFacilityAPITest {
    
    @TestSetup
    static void setupTestData() {
        TestDataFactory.createBaseData();
    }
    
    @IsTest
    static void testGetFacilitiesAsNDISOrgAdmin() {
        User adminUser = [SELECT Id, User_Type__c, Organization_Name__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/MobileFacilityAPI/facilities';
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = res;
            
            MobileFacilityAPI.getFacilities();
        }
    }
    
    @IsTest
    static void testGetFacilitiesAsNonNDISOrgAdmin() {
        User nonAdminUser = [SELECT Id, User_Type__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(nonAdminUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/MobileFacilityAPI/facilities';
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = res;
            
            MobileFacilityAPI.getFacilities();
        }
    }
    
    @IsTest
    static void testGetFacilitiesNoFacilities() {
        // Use existing admin user from test data factory
        User adminUser = [SELECT Id, User_Type__c, Organization_Name__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/MobileFacilityAPI/facilities';
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = res;
            
            MobileFacilityAPI.getFacilities();
        }
    }
    
    @IsTest
    static void testGetFacilitiesException() {
        // Create a user with null organization name to cause exception
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User exceptionUser = new User(
            Alias = 'except',
            Email = 'except.user@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'ExceptionUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'except.user@example.com',
            User_Type__c = 'NDIS Org Admin',
            Organization_Name__c = null
        );
        insert exceptionUser;
        
        System.runAs(exceptionUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/MobileFacilityAPI/facilities';
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = res;
            
            MobileFacilityAPI.getFacilities();
        }
    }
    
    @IsTest
    static void testUpdateFacilityMobileSettingsSuccess() {
        User adminUser = [SELECT Id, User_Type__c, Organization_Name__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = :adminUser.Organization_Name__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c WHERE Organisation__c = :org.Id AND Status__c = TRUE LIMIT 1];
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/MobileFacilityAPI/updateSettings';
            req.httpMethod = 'POST';
            req.addParameter('facilityId', facility.Id);
            req.addParameter('requestSignIn', 'true');
            req.addParameter('requestSignOut', 'false');
            RestContext.request = req;
            RestContext.response = res;
            
            MobileFacilityAPI.updateFacilityMobileSettings();
        }
    }
    
    @IsTest
    static void testUpdateFacilityMobileSettingsMissingFacilityId() {
        User adminUser = [SELECT Id, User_Type__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/MobileFacilityAPI/updateSettings';
            req.httpMethod = 'POST';
            req.addParameter('requestSignIn', 'true');
            req.addParameter('requestSignOut', 'false');
            RestContext.request = req;
            RestContext.response = res;
            
            MobileFacilityAPI.updateFacilityMobileSettings();
        }
    }
    
    @IsTest
    static void testUpdateFacilityMobileSettingsMissingRequestSignIn() {
        User adminUser = [SELECT Id, User_Type__c, Organization_Name__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = :adminUser.Organization_Name__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c WHERE Organisation__c = :org.Id AND Status__c = TRUE LIMIT 1];
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/MobileFacilityAPI/updateSettings';
            req.httpMethod = 'POST';
            req.addParameter('facilityId', facility.Id);
            req.addParameter('requestSignOut', 'false');
            RestContext.request = req;
            RestContext.response = res;
            
            MobileFacilityAPI.updateFacilityMobileSettings();
        }
    }
    
    @IsTest
    static void testUpdateFacilityMobileSettingsMissingRequestSignOut() {
        User adminUser = [SELECT Id, User_Type__c, Organization_Name__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = :adminUser.Organization_Name__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c WHERE Organisation__c = :org.Id AND Status__c = TRUE LIMIT 1];
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/MobileFacilityAPI/updateSettings';
            req.httpMethod = 'POST';
            req.addParameter('facilityId', facility.Id);
            req.addParameter('requestSignIn', 'true');
            RestContext.request = req;
            RestContext.response = res;
            
            MobileFacilityAPI.updateFacilityMobileSettings();
        }
    }
    
    @IsTest
    static void testUpdateFacilityMobileSettingsInvalidBooleanValues() {
        User adminUser = [SELECT Id, User_Type__c, Organization_Name__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = :adminUser.Organization_Name__c LIMIT 1];
            Facility__c facility = [SELECT Id FROM Facility__c WHERE Organisation__c = :org.Id AND Status__c = TRUE LIMIT 1];
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/MobileFacilityAPI/updateSettings';
            req.httpMethod = 'POST';
            req.addParameter('facilityId', facility.Id);
            req.addParameter('requestSignIn', 'invalid');
            req.addParameter('requestSignOut', 'invalid');
            RestContext.request = req;
            RestContext.response = res;
            
            MobileFacilityAPI.updateFacilityMobileSettings();
        }
    }
    
    @IsTest
    static void testUpdateFacilityMobileSettingsFacilityNotFound() {
        User adminUser = [SELECT Id, User_Type__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/MobileFacilityAPI/updateSettings';
            req.httpMethod = 'POST';
            req.addParameter('facilityId', 'a000000000000000');
            req.addParameter('requestSignIn', 'true');
            req.addParameter('requestSignOut', 'false');
            RestContext.request = req;
            RestContext.response = res;
            
            MobileFacilityAPI.updateFacilityMobileSettings();
        }
    }
    
    @IsTest
    static void testUpdateFacilityMobileSettingsException() {
        User adminUser = [SELECT Id, User_Type__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/MobileFacilityAPI/updateSettings';
            req.httpMethod = 'POST';
            req.addParameter('facilityId', null);
            req.addParameter('requestSignIn', 'true');
            req.addParameter('requestSignOut', 'false');
            RestContext.request = req;
            RestContext.response = res;
            
            MobileFacilityAPI.updateFacilityMobileSettings();
        }
    }
}