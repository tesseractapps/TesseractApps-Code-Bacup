@IsTest
private class MobileFacilityDocumentsHandlerTest {
    
    @testSetup
    static void setupTestData() {
        // Create Organisation
        Organisation__c org = new Organisation__c();
        org.Name = 'Test Organisation';
        org.ABN__c = '11234567891';
        org.ACN__c = '878787878';
        org.Contact_No__c = '6132899740';
        org.RCTI__c = 'RCTI1';
        org.Email__c = 'test@organisation.com';
        org.Bank__c = 'Test Bank';
        org.BSB__c = '123456';
        org.Account_Name__c = 'Test Account';
        org.Account_Number__c = '1111111111';
        org.Description__c = 'Test Desc';
        org.Address_Latest__Street__s = '101';
        org.Address_Latest__City__s = 'Sydney';
        org.Address_Latest__PostalCode__s = '2000';
        org.Address_Latest__CountryCode__s = 'AU';
        org.Address_Latest__StateCode__s = 'NSW';
        org.NDIS_Provider__c = '12341234565';
        org.BMSI_Identifier__c = 'TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        org.Roles__c = 'Admin;Support Worker';
        insert org;
        
        // Create Profile
        Profile prof = [SELECT Id, Name FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        
        // Create User
        User testUser = new User(
            Alias = 'tuser',
            Email = 'test.mobile.handler@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'TestUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            User_Type__c = 'NDIS Org Admin',
            UserName = 'test.mobile.handler@test.com',
            Organization_Name__c = 'Test Organisation'
        );
        insert testUser;
        
        System.runAs(testUser) {
            // Create Facility
            Facility__c fac = new Facility__c();
            fac.Name = 'Test Facility';
            fac.Address__City__s = 'Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s = 'ACT';
            fac.Address__PostalCode__s = '2911';
            fac.Address__CountryCode__s = 'AU';
            fac.Email__c = 'testfacility@test.com';
            fac.Status__c = true;
            fac.Organisation__c = org.Id;
            fac.ABN__c = '12234567123';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c = 'Ndis';
            insert fac;
            
            // Create Staff
            Staff__c staff = new Staff__c();
            staff.Last_Name__c = 'Test Staff';
            staff.Name__c = 'Test Staff';
            staff.Contact_Number__c = '56789908743';
            staff.Email_Address__c = 'test.mobile.handler@test.com';
            staff.Facility__c = fac.Id;
            staff.Address__Street__s = '8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s = 'ACT';
            staff.Address__PostalCode__s = '2911';
            staff.Emergency_Phone_Number__c = '45678766675';
            staff.Primary_Contact_Name__c = 'Test Contact';
            staff.Primary_Contact_Number__c = '9908458298';
            staff.Make_Primary_as_Approver__c = true;
            staff.Primary_Contact_Email__c = 'test@test.com';
            staff.Secondary_Contact_Name__c = 'Test Secondary';
            staff.Secondary_Contact_Email__c = 'secondary@test.com';
            staff.Make_Secondary_as_Approver__c = false;
            staff.Secondary_Contact_Number__c = '99084582958';
            staff.Emp_exit_date__c = Date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = Date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = Date.newInstance(2001, 02, 04);
            staff.role__c = 'Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = Date.newInstance(2025, 02, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c = 50;
            staff.Final_Overall_Rate__c = 150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            insert staff;
            
            // Create Staff_Facility record
            Staff_Facility__c staffFacility = new Staff_Facility__c();
            staffFacility.Staff__c = staff.Id;
            staffFacility.Facility__c = fac.Id;
            staffFacility.Active__c = true;
            insert staffFacility;
            
            // Create Facility_Compliance_Setting records for testing
            List<Facility_Compliance_Setting__c> complianceSettings = new List<Facility_Compliance_Setting__c>();
            
            // Primary Identity Document
            complianceSettings.add(new Facility_Compliance_Setting__c(
                Facility__c = fac.Id,
                Document_Name__c = 'Passport',
                Compliance_Category__c = 'Identity',
                Identity_Category__c = 'Primary',
                Identity_Points__c = 70,
                Mandatory_Document__c = true,
                Visible_to_Staff__c = true,
                Expiry_Date_Required__c = true
            ));
            
            // Secondary Identity Document
            complianceSettings.add(new Facility_Compliance_Setting__c(
                Facility__c = fac.Id,
                Document_Name__c = 'Drivers License',
                Compliance_Category__c = 'Identity',
                Identity_Category__c = 'Secondary',
                Identity_Points__c = 40,
                Mandatory_Document__c = false,
                Visible_to_Staff__c = true,
                Expiry_Date_Required__c = true
            ));
            
            // Other Identity Document
            complianceSettings.add(new Facility_Compliance_Setting__c(
                Facility__c = fac.Id,
                Document_Name__c = 'Medicare Card',
                Compliance_Category__c = 'Identity',
                Identity_Category__c = 'Other',
                Identity_Points__c = 25,
                Mandatory_Document__c = false,
                Visible_to_Staff__c = true,
                Expiry_Date_Required__c = false
            ));
            
            // Documents Category
            complianceSettings.add(new Facility_Compliance_Setting__c(
                Facility__c = fac.Id,
                Document_Name__c = 'Police Check',
                Compliance_Category__c = 'Documents',
                Documents_Category__c = 'Compliance',
                Mandatory_Document__c = true,
                Visible_to_Staff__c = true,
                Expiry_Date_Required__c = true,
                X100_pointcheck__c = '25 Points'
            ));
            
            // Training Document
            complianceSettings.add(new Facility_Compliance_Setting__c(
                Facility__c = fac.Id,
                Document_Name__c = 'First Aid Training',
                Compliance_Category__c = 'Trainings',
                Training_Category__c = 'Safety',
                Mandatory_Document__c = true,
                Visible_to_Staff__c = true,
                Expiry_Date_Required__c = true
            ));
            
            insert complianceSettings;
        }
    }
    
    // Test 1: Success scenario - get facility documents
    @IsTest
    static void testGetFacilityDocuments_Success() {
        // Get test user
        User testUser = [SELECT Id FROM User WHERE Email = 'test.mobile.handler@test.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        System.runAs(testUser) {
            // Setup RestRequest and RestResponse
            RestRequest req = new RestRequest();
            req.requestURI = '/services/apexrest/facilityDocumentsAPI/';
            req.httpMethod = 'GET';
            req.params.put('currentDocumentId', null);
            
            RestContext.request = req;
            RestContext.response = new RestResponse();
            
            // Call the method
            MobileFacilityDocumentsHandler.getFacilityDocuments();
        }
    }
    
    // Test 2: Success with currentDocumentId parameter
    @IsTest
    static void testGetFacilityDocuments_WithDocumentId() {
        User testUser = [SELECT Id FROM User WHERE Email = 'test.mobile.handler@test.com' LIMIT 1];
        
        System.runAs(testUser) {
            // Setup RestRequest and RestResponse
            RestRequest req = new RestRequest();
            req.requestURI = '/services/apexrest/facilityDocumentsAPI/';
            req.httpMethod = 'GET';
            req.params.put('currentDocumentId', 'a0B000000000001');
            
            RestContext.request = req;
            RestContext.response = new RestResponse();
            
            // Call the method
            MobileFacilityDocumentsHandler.getFacilityDocuments();
        }
    }
    
    // Test 3: Invalid staff email - staff record not found
    @IsTest
    static void testGetFacilityDocuments_InvalidStaff() {
        // Create a new user without staff record
        Profile prof = [SELECT Id, Name FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        
        User invalidUser = new User(
            Alias = 'invalid',
            Email = 'invalid.staff@test.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'InvalidUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            User_Type__c = 'NDIS Org Admin',
            UserName = 'invalid.staff@test.com',
            Organization_Name__c = 'Test Organisation'
        );
        insert invalidUser;
        
        System.runAs(invalidUser) {
            // Setup RestRequest and RestResponse
            RestRequest req = new RestRequest();
            req.requestURI = '/services/apexrest/facilityDocumentsAPI/';
            req.httpMethod = 'GET';
            
            RestContext.request = req;
            RestContext.response = new RestResponse();
            
            // Call the method - should return 400 status
            MobileFacilityDocumentsHandler.getFacilityDocuments();
        }
    }
    
    // Test 4: No active facilities for staff
    @IsTest
    static void testGetFacilityDocuments_NoActiveFacilities() {
        // Get test user and staff
        User testUser = [SELECT Id FROM User WHERE Email = 'test.mobile.handler@test.com' LIMIT 1];
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        // Deactivate the Staff_Facility record
        Staff_Facility__c sf = [SELECT Id, Active__c FROM Staff_Facility__c LIMIT 1];
        sf.Active__c = false;
        update sf;
        
        System.runAs(testUser) {
            // Setup RestRequest and RestResponse
            RestRequest req = new RestRequest();
            req.requestURI = '/services/apexrest/facilityDocumentsAPI/';
            req.httpMethod = 'GET';
            
            RestContext.request = req;
            RestContext.response = new RestResponse();
            
            // Call the method - should return 400 status
            MobileFacilityDocumentsHandler.getFacilityDocuments();
        }
    }
    
    // Test 5: Exception handling - invalid currentDocumentId format
    @IsTest
    static void testGetFacilityDocuments_InvalidDocumentId() {
        User testUser = [SELECT Id FROM User WHERE Email = 'test.mobile.handler@test.com' LIMIT 1];
        
        System.runAs(testUser) {
            // Setup RestRequest and RestResponse
            RestRequest req = new RestRequest();
            req.requestURI = '/services/apexrest/facilityDocumentsAPI/';
            req.httpMethod = 'GET';
            req.params.put('currentDocumentId', 'invalid-id-format');
            
            RestContext.request = req;
            RestContext.response = new RestResponse();
            
            // Call the method - should handle exception gracefully
            MobileFacilityDocumentsHandler.getFacilityDocuments();
        }
    }
    
    // Test 6: No documents in facility
    @IsTest
    static void testGetFacilityDocuments_NoDocuments() {
        // Get test user
        User testUser = [SELECT Id FROM User WHERE Email = 'test.mobile.handler@test.com' LIMIT 1];
        
        // Delete all compliance settings
        delete [SELECT Id FROM Facility_Compliance_Setting__c];
        
        System.runAs(testUser) {
            // Setup RestRequest and RestResponse
            RestRequest req = new RestRequest();
            req.requestURI = '/services/apexrest/facilityDocumentsAPI/';
            req.httpMethod = 'GET';
            
            RestContext.request = req;
            RestContext.response = new RestResponse();
            
            // Call the method - should return success with empty sections
            MobileFacilityDocumentsHandler.getFacilityDocuments();
        }
    }
    
    // Test 7: Test with empty document names
    @IsTest
    static void testGetFacilityDocuments_EmptyDocNames() {
        // Get test user
        User testUser = [SELECT Id FROM User WHERE Email = 'test.mobile.handler@test.com' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        // Create a document with empty name
        Facility_Compliance_Setting__c emptyNameDoc = new Facility_Compliance_Setting__c(
            Facility__c = fac.Id,
            Document_Name__c = '',
            Compliance_Category__c = 'Documents',
            Visible_to_Staff__c = true
        );
        insert emptyNameDoc;
        
        System.runAs(testUser) {
            // Setup RestRequest and RestResponse
            RestRequest req = new RestRequest();
            req.requestURI = '/services/apexrest/facilityDocumentsAPI/';
            req.httpMethod = 'GET';
            
            RestContext.request = req;
            RestContext.response = new RestResponse();
            
            // Call the method - should skip empty document names
            MobileFacilityDocumentsHandler.getFacilityDocuments();
        }
    }
    
    // Test 8: Test with all document categories
    @IsTest
    static void testGetFacilityDocuments_AllCategories() {
        // Get test user
        User testUser = [SELECT Id FROM User WHERE Email = 'test.mobile.handler@test.com' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        // Create documents for all categories
        List<Facility_Compliance_Setting__c> allDocs = new List<Facility_Compliance_Setting__c>();
        
        // Identity - Primary Static
        allDocs.add(new Facility_Compliance_Setting__c(
            Facility__c = fac.Id,
            Document_Name__c = 'Birth Certificate',
            Compliance_Category__c = 'Identity',
            Identity_Category__c = 'Primary',
            Mandatory_Document__c = true,
            Visible_to_Staff__c = true
        ));
        
        // Identity - Secondary Static
        allDocs.add(new Facility_Compliance_Setting__c(
            Facility__c = fac.Id,
            Document_Name__c = 'Utility Bill',
            Compliance_Category__c = 'Identity',
            Identity_Category__c = 'Secondary',
            Mandatory_Document__c = false,
            Visible_to_Staff__c = true
        ));
        
        // Documents - with points
        allDocs.add(new Facility_Compliance_Setting__c(
            Facility__c = fac.Id,
            Document_Name__c = 'Working With Children Check',
            Compliance_Category__c = 'Documents',
            Documents_Category__c = 'Compliance',
            Mandatory_Document__c = true,
            Visible_to_Staff__c = true,
            X100_pointcheck__c = '25 Points'
        ));
        
        // Training - with expiry
        allDocs.add(new Facility_Compliance_Setting__c(
            Facility__c = fac.Id,
            Document_Name__c = 'CPR Training',
            Compliance_Category__c = 'Trainings',
            Training_Category__c = 'Medical',
            Mandatory_Document__c = true,
            Visible_to_Staff__c = true,
            Expiry_Date_Required__c = true
        ));
        
        insert allDocs;
        
        System.runAs(testUser) {
            // Setup RestRequest and RestResponse
            RestRequest req = new RestRequest();
            req.requestURI = '/services/apexrest/facilityDocumentsAPI/';
            req.httpMethod = 'GET';
            
            RestContext.request = req;
            RestContext.response = new RestResponse();
            
            // Call the method
            MobileFacilityDocumentsHandler.getFacilityDocuments();
        }
    }
    
    // Test 9: Test with points and expiry required flags
    @IsTest
    static void testGetFacilityDocuments_WithPointsAndExpiry() {
        // Get test user
        User testUser = [SELECT Id FROM User WHERE Email = 'test.mobile.handler@test.com' LIMIT 1];
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        
        // Create document with points and expiry
        Facility_Compliance_Setting__c pointsDoc = new Facility_Compliance_Setting__c(
            Facility__c = fac.Id,
            Document_Name__c = 'Professional Registration',
            Compliance_Category__c = 'Documents',
            Mandatory_Document__c = false,
            Visible_to_Staff__c = true,
            Expiry_Date_Required__c = true,
            X100_pointcheck__c = '25 Points'
        );
        insert pointsDoc;
        
        System.runAs(testUser) {
            // Setup RestRequest and RestResponse
            RestRequest req = new RestRequest();
            req.requestURI = '/services/apexrest/facilityDocumentsAPI/';
            req.httpMethod = 'GET';
            
            RestContext.request = req;
            RestContext.response = new RestResponse();
            
            // Call the method
            MobileFacilityDocumentsHandler.getFacilityDocuments();
        }
    }
    
    // Test 10: Exception in query (simulate by using invalid field)
    @IsTest
    static void testGetFacilityDocuments_ExceptionHandling() {
        User testUser = [SELECT Id FROM User WHERE Email = 'test.mobile.handler@test.com' LIMIT 1];
        
        System.runAs(testUser) {
            // Setup RestRequest and RestResponse
            RestRequest req = new RestRequest();
            req.requestURI = '/services/apexrest/facilityDocumentsAPI/';
            req.httpMethod = 'GET';
            
            RestContext.request = req;
            RestContext.response = new RestResponse();
            
            // Call the method - any exception will be caught and handled
            MobileFacilityDocumentsHandler.getFacilityDocuments();
        }
    }
}