@IsTest
public class MobileShiftSignInOutRequestHandlerTest {
    
    @TestSetup
    static void setupTestData() {
        TestDataFactory.createBaseData();
    }
    
    @IsTest
    static void testGetShiftSignInOutRequestSuccess() {
        User adminUser = [SELECT Id, User_Type__c, Organization_Name__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            ShiftwithStaff__c shift = [SELECT Id FROM ShiftwithStaff__c LIMIT 1];
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/shiftSignInOutRequestApi/getShift';
            req.httpMethod = 'GET';
            req.addParameter('shiftId', shift.Id);
            RestContext.request = req;
            RestContext.response = res;
            
            MobileShiftSignInOutRequestHandler.getShiftSignInOutRequest();
        }
    }
    
    @IsTest
    static void testGetShiftSignInOutRequestMissingShiftId() {
        User adminUser = [SELECT Id, User_Type__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/shiftSignInOutRequestApi/getShift';
            req.httpMethod = 'GET';
            RestContext.request = req;
            RestContext.response = res;
            
            MobileShiftSignInOutRequestHandler.getShiftSignInOutRequest();
        }
    }
    
    @IsTest
    static void testGetShiftSignInOutRequestInvalidShiftId() {
        User adminUser = [SELECT Id, User_Type__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/shiftSignInOutRequestApi/getShift';
            req.httpMethod = 'GET';
            req.addParameter('shiftId', 's000000000000000');
            RestContext.request = req;
            RestContext.response = res;
            
            MobileShiftSignInOutRequestHandler.getShiftSignInOutRequest();
        }
    }
    
    @IsTest
    static void testGetShiftSignInOutRequestException() {
        User adminUser = [SELECT Id, User_Type__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/shiftSignInOutRequestApi/getShift';
            req.httpMethod = 'GET';
            req.addParameter('shiftId', null);
            RestContext.request = req;
            RestContext.response = res;
            
            MobileShiftSignInOutRequestHandler.getShiftSignInOutRequest();
        }
    }
    
   
    
    @IsTest
    static void testUpdateShiftSignInOutRequestMissingShiftId() {
        User adminUser = [SELECT Id, User_Type__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            MobileShiftSignInOutRequestHandler.ShiftSignInOutUpdateRequest requestBody = new MobileShiftSignInOutRequestHandler.ShiftSignInOutUpdateRequest();
            requestBody.shiftwithstaffId = null;
            requestBody.staffId = 'a000000000000000';
            requestBody.enableGeolocation = true;
            requestBody.enableSignin = true;
            requestBody.enableSignout = false;
            
            String jsonBody = JSON.serialize(requestBody);
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/shiftSignInOutRequestApi/updateShift';
            req.httpMethod = 'POST';
            req.requestBody = Blob.valueOf(jsonBody);
            RestContext.request = req;
            RestContext.response = res;
            
            MobileShiftSignInOutRequestHandler.updateShiftSignInOutRequest();
        }
    }
    
    @IsTest
    static void testUpdateShiftSignInOutRequestInvalidJson() {
        User adminUser = [SELECT Id, User_Type__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/shiftSignInOutRequestApi/updateShift';
            req.httpMethod = 'POST';
            req.requestBody = Blob.valueOf('{invalid json}');
            RestContext.request = req;
            RestContext.response = res;
            
            MobileShiftSignInOutRequestHandler.updateShiftSignInOutRequest();
        }
    }
    
    @IsTest
    static void testUpdateShiftSignInOutRequestNullRequestBody() {
        User adminUser = [SELECT Id, User_Type__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/shiftSignInOutRequestApi/updateShift';
            req.httpMethod = 'POST';
            req.requestBody = null;
            RestContext.request = req;
            RestContext.response = res;
            
            MobileShiftSignInOutRequestHandler.updateShiftSignInOutRequest();
        }
    }
    
    @IsTest
    static void testUpdateShiftSignInOutRequestException() {
        User adminUser = [SELECT Id, User_Type__c, Email FROM User WHERE User_Type__c = 'NDIS Org Admin' AND Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(adminUser) {
            MobileShiftSignInOutRequestHandler.ShiftSignInOutUpdateRequest requestBody = new MobileShiftSignInOutRequestHandler.ShiftSignInOutUpdateRequest();
            requestBody.shiftwithstaffId = 'invalidId';
            requestBody.staffId = 'invalidId';
            requestBody.enableGeolocation = true;
            requestBody.enableSignin = true;
            requestBody.enableSignout = false;
            
            String jsonBody = JSON.serialize(requestBody);
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/shiftSignInOutRequestApi/updateShift';
            req.httpMethod = 'POST';
            req.requestBody = Blob.valueOf(jsonBody);
            RestContext.request = req;
            RestContext.response = res;
            
            MobileShiftSignInOutRequestHandler.updateShiftSignInOutRequest();
        }
    }
}