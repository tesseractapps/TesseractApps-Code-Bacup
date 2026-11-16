@isTest
public class XeroSettingsControllerTest {
    // ------------------- 🔹 TEST DATA SETUP -------------------
    @testSetup
    static void testData() {
        Organisation__c org = new Organisation__c(
            Name = 'Ashfield Consultants',
            ABN__c = '11234567891',
            ACN__c = '878787878',
            Contact_No__c = '6132899740',
            RCTI__c = 'RCTI1',
            Email__c = 'dsfdsfsd@gmail.com',
            Bank__c = 'Bank Test',
            BSB__c = 'BSB Test',
            Account_Name__c = 'Test Account',
            Account_Number__c = '1111111111',
            Description__c = 'test Desc',
            Address_Latest__Street__s = '101',
            Address_Latest__City__s = 'Himas Waterhen',
            Address_Latest__PostalCode__s = '2060',
            Address_Latest__CountryCode__s = 'AU',
            Address_Latest__StateCode__s = 'NSW',
            NDIS_Provider__c = '12341234565',
            BMSI_Identifier__c = 'TEST BMSI',
            SoftwareId__c = 'jhdfn18328',
            Branch_code__c = 'BS123',
            Contact_Name__c = 'Test Contact',
            User_Type__c = 'NDIS Org Admin',
            Client_Id__c = 'client_id_123',
            Client_Secret__c = 'client_secret_123'
        );
        insert org;
        
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'praveen',
            Email = 'manualtesting.209458@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'StaffOne209458',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'manualtesting.209458@hotmail.com',
            Organization_Name__c = 'Ashfield Consultants'
        );
        insert user;
        
        System.runAs(user){   
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='12345678900';
            fac.Phone__c = '12323213';
            insert fac;
            
            Facility__c fac2 = new Facility__c(
                Name = 'Ashfield Facility 2',
                Address__City__s = 'Crace',
                Address__Street__s = '10 Test Street',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Address__CountryCode__s = 'AU',
                Email__c = 'facility2@test.com',
                Status__c = true,
                Organisation__c = org.Id,
                ABN__c = '12345678901',
                Phone__c = '12323214'
            );
            insert fac2;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.209458@hotmail.com';
            staff.Facility__c=fac.Id;
            staff.Address__Street__s='8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s='ACT';
            staff.Address__PostalCode__s='2911';
            staff.Emergency_Phone_Number__c='45678766675';
            staff.Primary_Contact_Name__c='Praveen';
            staff.Primary_Contact_Number__c='9908458298';
            staff.Make_Primary_as_Approver__c=true;
            staff.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff.Secondary_Contact_Name__c='maheswari';
            staff.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff.Make_Secondary_as_Approver__c=false;
            staff.Secondary_Contact_Number__c='99084582958';
            staff.Emp_exit_date__c = date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff.role__c='Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c=50;
            staff.Final_Overall_Rate__c=150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            insert staff;
            
            Xero_Entity__c entity1 = new Xero_Entity__c();
            entity1.First_Name__c = 'John';
            entity1.Last_Name__c = 'Doe';
            entity1.Organization__c = org.Id;            
            insert entity1;
            
            Facility_Role__c role1 = new Facility_Role__c(
                Role_Name__c = 'Support Worker',
                Facility__c = fac.Id
            );
            insert role1;
            
            Facility_Role__c role2 = new Facility_Role__c(
                Role_Name__c = 'Support Worker',
                Facility__c = fac2.Id
            );
            insert role2;
            
            Facility_Role__c role3 = new Facility_Role__c(
                Role_Name__c = 'Manager',
                Facility__c = fac.Id
            );
            insert role3;
        }
    }
    
    // ============================================================
    // HTTP MOCK
    // ============================================================
    public class XeroHttpMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            
            String endpoint = req.getEndpoint();
            String method = req.getMethod();
            
            // XERO OAUTH TOKEN
            if (endpoint != null && endpoint.contains('identity.xero.com/connect/token')) {
                res.setStatusCode(200);
                res.setBody('{"access_token":"test-access-token","token_type":"Bearer","expires_in":1800,"scope":"payroll.settings payroll.employees"}');
                return res;
            }
            
            // XERO CONNECTION / TENANT
            if (endpoint != null && endpoint.contains('/connections')) {
                res.setStatusCode(200);
                res.setBody('[{"id":"test-tenant-001","tenantId":"test-tenant-001","tenantType":"ORGANISATION","tenantName":"Test Organisation"}]');
                return res;
            }
            
            // XERO PAY ITEMS
            if (method == 'GET' && endpoint != null && endpoint.contains('/payroll.xro/1.0/PayItems')) {
                res.setStatusCode(200);
                res.setBody('{"PayItems":{"EarningsRates":[' +
                            '{"EarningsRateID":"existing-rate-001","Name":"Existing Ordinary Hours","EarningsType":"ORDINARYTIMEEARNINGS","RateType":"RATEPERUNIT","TypeOfUnits":"Hours","Status":"ACTIVE"},' +
                            '{"EarningsRateID":"reimbursement-001","Name":"Reimbursement - Travel","EarningsType":"REIMBURSEMENT","RateType":"RATEPERUNIT","TypeOfUnits":"Hours","Status":"ACTIVE"},' +
                            '{"EarningsRateID":"saturday-rate-001","Name":"Saturday Ordinary","EarningsType":"ORDINARYTIMEEARNINGS","RateType":"RATEPERUNIT","TypeOfUnits":"Hours","Status":"ACTIVE"}' +
                            ']}}');
                return res;
            }
            
            // XERO ACCOUNTS
            if (endpoint != null && endpoint.contains('/api.xro/2.0/Accounts')) {
                res.setStatusCode(200);
                res.setBody('{"Accounts":[' +
                            '{"AccountID":"account-477","Code":"477","Name":"Test Expense Account"},' +
                            '{"AccountID":"account-400","Code":"400","Name":"Other Account"}' +
                            ']}');
                return res;
            }
            
            // XERO V2 EARNINGS RATE POST
            if (method == 'POST' && endpoint != null && endpoint.contains('/payroll.xro/2.0/earningsRates')) {
                res.setStatusCode(201);
                res.setBody('{"earningsRateID":"new-earnings-rate-001","name":"New Test Earnings Rate"}');
                return res;
            }
            
            res.setStatusCode(404);
            res.setBody('{"error":"No mock response configured"}');
            return res;
        }
    }
    
    // ============================================================
    // HELPER METHODS
    // ============================================================
    private static Id getTestOrganisationId() {
        return [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1].Id;
    }
    
    private static User getTestUser() {
        return [SELECT Id, Email FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    }
    
    // ============================================================
    // TEST: getCurrentUserOrganisationId - SUCCESS
    // ============================================================
    @IsTest
    static void testGetCurrentUserOrganisationId_Success() {
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            Test.startTest();
            Id result = XeroSettingsController.getCurrentUserOrganisationId();
            Test.stopTest();
            
            System.assertNotEquals(null, result, 'Organisation ID should be returned.');
        }
    }
    
    // ============================================================
    // TEST: getCurrentUserOrganisationId - NO STAFF RECORD
    // ============================================================
    @IsTest
    static void testGetCurrentUserOrganisationId_NoStaff() {
        User testUser = getTestUser();
        
        // Delete staff record to simulate no staff found
        delete [SELECT Id FROM Staff__c WHERE Email_Address__c = :testUser.Email];
        
        System.runAs(testUser) {
            Test.startTest();
            try {
                XeroSettingsController.getCurrentUserOrganisationId();
                System.assert(false, 'Expected exception was not thrown.');
            } catch (AuraHandledException e) {
            }
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: getAllFacilityRoles
    // ============================================================
    @IsTest
    static void testGetAllFacilityRoles() {
        Id orgId = getTestOrganisationId();
        
        Test.startTest();
        List<Facility_Role__c> roles = XeroSettingsController.getAllFacilityRoles(orgId);
        Test.stopTest();
        
        System.assert(roles.size() >= 2, 'Expected Facility Roles to be returned.');
        
        Boolean foundSupportWorker = false;
        for (Facility_Role__c role : roles) {
            if (role.Role_Name__c == 'Support Worker') {
                foundSupportWorker = true;
            }
            System.assertNotEquals('Reimbursement', role.Role_Name__c, 'Reimbursement role should not be returned.');
        }
        System.assertEquals(true, foundSupportWorker, 'Support Worker role should exist.');
    }
    
    // ============================================================
    // TEST: getAllFacilityRoles - NULL ORGANISATION
    // ============================================================
    @IsTest
    static void testGetAllFacilityRoles_NullOrganisation() {
        Test.startTest();
        List<Facility_Role__c> roles = XeroSettingsController.getAllFacilityRoles(null);
        Test.stopTest();
        
        System.assertEquals(0, roles.size(), 'Empty list should be returned for null organisation.');
    }
    
    // ============================================================
    // TEST: saveFacilityXeroSetting - EARNINGS
    // ============================================================
    @IsTest
    static void testSaveFacilityXeroSetting_Earnings() {
        Id orgId = getTestOrganisationId();
        
        Test.startTest();
        List<Facility_Xero_Setting__c> settings = XeroSettingsController.saveFacilityXeroSetting(
            orgId,
            'Earnings',         // payItemType
            'Support Worker',   // roleName
            null,               // roleIds
            'xero-earnings-001',// xeroPayitem
            'Ordinary Hours',   // xeroPayitemName
            'Afternoon',        // category
            'Custom',           // shiftType
            'General',          // customShiftType
            null,               // brokenType
            null,               // sleepoverType
            null,               // overTimeType
            null,               // subShiftType
            'General Rate 1'    // customRateType
        );
        Test.stopTest();
        
        System.assertEquals(2, settings.size(), 'Two settings should be created for two facilities with Support Worker role.');
        
        List<Facility_Xero_Setting__c> databaseSettings = [
            SELECT Id, Pay_Item_Type__c, Xero_Payitem__c, Xero_Payitem_Name__c, Category__c, Shift_Type__c
            FROM Facility_Xero_Setting__c
            WHERE Xero_Payitem__c = 'xero-earnings-001'
        ];
        
        System.assertEquals(2, databaseSettings.size());
        for (Facility_Xero_Setting__c setting : databaseSettings) {
            System.assertEquals('Earnings', setting.Pay_Item_Type__c);
            System.assertEquals('xero-earnings-001', setting.Xero_Payitem__c);
        }
    }
    
    // ============================================================
    // TEST: saveFacilityXeroSetting - REIMBURSEMENT
    // ============================================================
    @IsTest
    static void testSaveFacilityXeroSetting_Reimbursement() {
        Id orgId = getTestOrganisationId();
        
        Test.startTest();
        List<Facility_Xero_Setting__c> settings = XeroSettingsController.saveFacilityXeroSetting(
            orgId,
            'Reimbursement',
            null,
            null,
            'xero-reimbursement-001',
            'Reimbursement - Travel',
            null,   // category
            null,   // shiftType
            null,   // customShiftType
            null,   // brokenType
            null,   // sleepoverType
            null,   // overTimeType
            null,   // subShiftType
            null    // customRateType
        );
        Test.stopTest();
        
        System.assertEquals(1, settings.size(), 'One reimbursement setting should be created.');
        
        List<Facility_Xero_Setting__c> dbSettings = [
            SELECT Id, Pay_Item_Type__c, Xero_Payitem__c, Facility_Role__r.Role_Name__c
            FROM Facility_Xero_Setting__c
            WHERE Xero_Payitem__c = 'xero-reimbursement-001'
        ];
        
        System.assertEquals(1, dbSettings.size());
        System.assertEquals('Reimbursement', dbSettings[0].Pay_Item_Type__c);
        System.assertEquals('Reimbursement', dbSettings[0].Facility_Role__r.Role_Name__c);
    }
    
    // ============================================================
    // TEST: saveFacilityXeroSetting - DUPLICATE REIMBURSEMENT
    // ============================================================
    @IsTest
    static void testSaveFacilityXeroSetting_DuplicateReimbursement() {
        Id orgId = getTestOrganisationId();
        
        // Create first reimbursement
        XeroSettingsController.saveFacilityXeroSetting(
            orgId, 'Reimbursement', null, null,
            'xero-reimb-001', 'Reimbursement - First',
            null, null, null, null, null, null, null, null
        );
        
        Test.startTest();
        try {
            XeroSettingsController.saveFacilityXeroSetting(
                orgId, 'Reimbursement', null, null,
                'xero-reimb-002', 'Reimbursement - Second',
                null, null, null, null, null, null, null, null
            );
            System.assert(false, 'Expected exception was not thrown.');
        } catch (AuraHandledException e) {
        }
        Test.stopTest();
    }
    
    // ============================================================
    // TEST: saveFacilityXeroSetting - VALIDATION ERRORS
    // ============================================================
    @IsTest
    static void testSaveFacilityXeroSetting_ValidationErrors() {
        Id orgId = getTestOrganisationId();
        Test.startTest();
        try {
            XeroSettingsController.saveFacilityXeroSetting(null, 'Earnings', 'Support Worker',null, 'xero-001', 'Test', 'Morning', 'General', null, null, null, null, null, null);
        } catch (AuraHandledException e) {
            System.debug(e.getMessage());
        }
        try {
            XeroSettingsController.saveFacilityXeroSetting(orgId, null, 'Support Worker',null, 'xero-001', 'Test', 'Morning', 'General', null, null, null, null, null, null);
        } catch (AuraHandledException e) {
            System.debug(e.getMessage());
        }
        try {
            XeroSettingsController.saveFacilityXeroSetting(orgId, 'Earnings', 'Support Worker', null,null, 'Test', 'Morning', 'General', null, null, null, null, null, null);
        } catch (AuraHandledException e) {
            System.debug(e.getMessage());
        }
        try {
            XeroSettingsController.saveFacilityXeroSetting(orgId, 'Earnings', null,null, 'xero-001', 'Test', 'Morning', 'General', null, null, null, null, null, null);
        } catch (AuraHandledException e) {
            System.debug(e.getMessage());
        }
        try {
            XeroSettingsController.saveFacilityXeroSetting(orgId, 'Earnings', 'Support Worker',null, 'xero-001', 'Test', null, 'General', null, null, null, null, null, null);
        } catch (AuraHandledException e) {
            System.debug(e.getMessage());
        }
        try {
            XeroSettingsController.saveFacilityXeroSetting(orgId, 'Earnings', 'Support Worker',null, 'xero-001', 'Test', 'Morning', null, null, null, null, null, null, null);
        } catch (AuraHandledException e) {
            System.debug(e.getMessage());
        }
        Test.stopTest();
    }
    
    // ============================================================
    // TEST: saveFacilityXeroSetting - NO FACILITY ROLE FOUND
    // ============================================================
    @IsTest
    static void testSaveFacilityXeroSetting_NoFacilityRole() {
        Id orgId = getTestOrganisationId();
        
        Test.startTest();
        try {
            XeroSettingsController.saveFacilityXeroSetting(
                orgId, 'Earnings', 'NonExistentRole', null,
                'xero-001', 'Test', 'Morning', 'General',
                null, null, null, null, null, null
            );
            System.assert(false, 'Expected exception was not thrown.');
        } catch (AuraHandledException e) {
        }
        Test.stopTest();
    }
    
    // ============================================================
    // TEST: saveFacilityXeroSetting - DUPLICATE PAYITEM
    // ============================================================
    @IsTest
    static void testSaveFacilityXeroSetting_DuplicatePayitem() {
        Id orgId = getTestOrganisationId();
        XeroSettingsController.saveFacilityXeroSetting(
            orgId, 'Earnings', 'Manager', null,
            'xero-duplicate-001', 'Duplicate Pay Item', 'Morning', 'General',
            null, null, null, null, null, null
        );
        Test.startTest();
        try {
            XeroSettingsController.saveFacilityXeroSetting(
                orgId, 'Earnings', 'Support Worker', null,
                'xero-duplicate-001', 'Duplicate Pay Item', 'Afternoon', 'Custom',
                'General', null, null, null, null, 'General Rate 1'
            );
        } catch (AuraHandledException e) {
            System.debug(e.getMessage());
        }
        Test.stopTest();
    }
    
    // ============================================================
    // TEST: getXeroSettingByRoleName
    // ============================================================
    @IsTest
    static void testGetXeroSettingByRoleName() {
        Id orgId = getTestOrganisationId();
        
        Facility_Role__c role = [SELECT Id FROM Facility_Role__c WHERE Role_Name__c = 'Support Worker' LIMIT 1];
        
        Facility_Xero_Setting__c setting = new Facility_Xero_Setting__c(
            Name = 'Test Xero Setting',
            Facility_Role__c = role.Id,
            Pay_Item_Type__c = 'Earnings',
            Xero_Payitem__c = 'test-payitem-001',
            Xero_Payitem_Name__c = 'Test Pay Item',
            Category__c = 'Morning',
            Shift_Type__c = 'General'
        );
        insert setting;
        
        Test.startTest();
        Facility_Xero_Setting__c result = XeroSettingsController.getXeroSettingByRoleName('Support Worker', orgId);
        Test.stopTest();
        
        System.assertNotEquals(null, result, 'Setting should be returned.');
        System.assertEquals('test-payitem-001', result.Xero_Payitem__c);
        System.assertEquals('Test Pay Item', result.Xero_Payitem_Name__c);
    }
    
    // ============================================================
    // TEST: getXeroSettingByRoleName - NULL PARAMS
    // ============================================================
    @IsTest
    static void testGetXeroSettingByRoleName_NullParams() {
        Test.startTest();
        Facility_Xero_Setting__c result1 = XeroSettingsController.getXeroSettingByRoleName(null, getTestOrganisationId());
        Facility_Xero_Setting__c result2 = XeroSettingsController.getXeroSettingByRoleName('Support Worker', null);
        Test.stopTest();
        
        System.assertEquals(null, result1, 'Null should be returned for blank role name.');
        System.assertEquals(null, result2, 'Null should be returned for null organisation.');
    }
    
    // ============================================================
    // TEST: getXeroSettingByRoleName - NOT FOUND
    // ============================================================
    @IsTest
    static void testGetXeroSettingByRoleName_NotFound() {
        Id orgId = getTestOrganisationId();
        
        Test.startTest();
        Facility_Xero_Setting__c result = XeroSettingsController.getXeroSettingByRoleName('NonExistentRole', orgId);
        Test.stopTest();
        
        System.assertEquals(null, result, 'Null should be returned when role not found.');
    }
    
    // ============================================================
    // TEST: getAllXeroSettings
    // ============================================================
    @IsTest
    static void testGetAllXeroSettings() {
        Id orgId = getTestOrganisationId();
        
        List<Facility_Role__c> roles = [SELECT Id, Role_Name__c, Facility__c FROM Facility_Role__c];
        
        for (Facility_Role__c role : roles) {
            Facility_Xero_Setting__c setting = new Facility_Xero_Setting__c(
                Name = 'Setting for ' + role.Role_Name__c,
                Facility_Role__c = role.Id,
                Pay_Item_Type__c = 'Earnings',
                Xero_Payitem__c = 'payitem-' + role.Id,
                Xero_Payitem_Name__c = 'Pay Item ' + role.Role_Name__c,
                Category__c = 'Morning',
                Shift_Type__c = 'General'
            );
            insert setting;
        }
        
        Test.startTest();
        List<Map<String, Object>> results = XeroSettingsController.getAllXeroSettings(orgId);
        Test.stopTest();
        
        System.assertNotEquals(null, results, 'Results should not be null.');
        System.assert(results.size() > 0, 'Should have at least one grouped setting.');
    }
    
    // ============================================================
    // TEST: getAllXeroSettings - NULL ORGANISATION
    // ============================================================
    @IsTest
    static void testGetAllXeroSettings_NullOrganisation() {
        Test.startTest();
        List<Map<String, Object>> results = XeroSettingsController.getAllXeroSettings(null);
        Test.stopTest();
        
        System.assertEquals(0, results.size(), 'Empty list should be returned for null organisation.');
    }
    
    // ============================================================
    // TEST: updateFacilityXeroSetting
    // ============================================================
    @IsTest
    static void testUpdateFacilityXeroSetting() {
        Id orgId = getTestOrganisationId();
        
        Facility_Role__c role = [SELECT Id FROM Facility_Role__c WHERE Role_Name__c = 'Manager' LIMIT 1];
        
        Facility_Xero_Setting__c setting = new Facility_Xero_Setting__c(
            Name = 'Old Setting',
            Facility_Role__c = role.Id,
            Pay_Item_Type__c = 'Earnings',
            Xero_Payitem__c = 'old-payitem',
            Xero_Payitem_Name__c = 'Old Pay Item',
            Category__c = 'Morning',
            Shift_Type__c = 'General'
        );
        insert setting;
        
        Test.startTest();
        List<Facility_Xero_Setting__c> updated = XeroSettingsController.updateFacilityXeroSetting(
            orgId,
            setting.Id,         // settingIds
            'Earnings',         // payItemType
            'Manager',          // roleName
            null,               // roleIds
            'new-payitem',      // xeroPayitem
            'New Pay Item',     // xeroPayitemName
            'Afternoon',        // category
            'Custom',           // shiftType
            'General',          // customShiftType
            null,               // brokenType
            null,               // sleepoverType
            null,               // overTimeType
            null,               // subShiftType
            'General Rate 1'    // customRateType
        );
        Test.stopTest();
        
        System.assertEquals(1, updated.size());
        
        Facility_Xero_Setting__c result = [SELECT Xero_Payitem__c, Xero_Payitem_Name__c, Category__c, Shift_Type__c FROM Facility_Xero_Setting__c WHERE Id = :setting.Id];
        System.assertEquals('new-payitem', result.Xero_Payitem__c);
        System.assertEquals('New Pay Item', result.Xero_Payitem_Name__c);
        System.assertEquals('Afternoon', result.Category__c);
        System.assertEquals('Custom', result.Shift_Type__c);
    }
    
    // ============================================================
    // TEST: updateFacilityXeroSetting - REIMBURSEMENT
    // ============================================================
    @IsTest
    static void testUpdateFacilityXeroSetting_Reimbursement() {
        Id orgId = getTestOrganisationId();
        
        // Create reimbursement setting
        List<Facility_Xero_Setting__c> created = XeroSettingsController.saveFacilityXeroSetting(
            orgId, 'Reimbursement', null, null,
            'reimb-001', 'Reimbursement - Travel',
            null, null, null, null, null, null, null, null
        );
        
        Test.startTest();
        List<Facility_Xero_Setting__c> updated = XeroSettingsController.updateFacilityXeroSetting(
            orgId,
            created[0].Id,
            'Reimbursement',
            null,
            null,
            'reimb-002',
            'Reimbursement - Updated',
            null, null, null, null, null, null, null, null
        );
        Test.stopTest();
        
        System.assertEquals(1, updated.size());
        System.assertEquals('reimb-002', updated[0].Xero_Payitem__c);
        System.assertEquals('Reimbursement - Updated', updated[0].Xero_Payitem_Name__c);
    }
    
    // ============================================================
    // TEST: updateFacilityXeroSetting - VALIDATION ERRORS
    // ============================================================
    @IsTest
    static void testUpdateFacilityXeroSetting_ValidationErrors() {
        Id orgId = getTestOrganisationId();
        
        // Find Manager role
        Facility_Role__c managerRole = [
            SELECT Id
            FROM Facility_Role__c
            WHERE Role_Name__c = 'Manager'
            AND Facility__r.Organisation__c = :orgId
            LIMIT 1
        ];
        
        // Create a Manager Xero Setting
        Facility_Xero_Setting__c managerSetting =
            new Facility_Xero_Setting__c(
                Name = 'Manager Test Setting',
                Facility_Role__c = managerRole.Id,
                Pay_Item_Type__c = 'Earnings',
                Xero_Payitem__c = 'manager-payitem',
                Xero_Payitem_Name__c = 'Manager Pay Item',
                Category__c = 'Morning',
                Shift_Type__c = 'Morning'
            );
        
        insert managerSetting;
        
        String settingId = managerSetting.Id;
        
        Test.startTest();
        
        // Missing Setting IDs
        try {
            XeroSettingsController.updateFacilityXeroSetting(
                orgId, null, 'Earnings', null, 'Manager',
                'xero-001', 'Test', 'Morning', 'General',
                null, null, null, null, null, null
            );
        } catch (AuraHandledException e) {
            System.debug(e.getMessage());
        }
        
        // Payitem already assigned to another role
        try {
            XeroSettingsController.updateFacilityXeroSetting(
                orgId, settingId, 'Earnings', null, 'Support Worker',
                'payitem-001', 'Test', 'Morning', 'General',
                null, null, null, null, null, null
            );
        } catch (AuraHandledException e) {
            System.debug(e.getMessage());
        }
        
        Test.stopTest();
    }
    
    // ============================================================
    // TEST: deleteMultipleXeroSettings
    // ============================================================
    @IsTest
    static void testDeleteMultipleXeroSettings() {
        Id orgId = getTestOrganisationId();
        
        Facility_Role__c role = [SELECT Id FROM Facility_Role__c WHERE Role_Name__c = 'Manager' LIMIT 1];
        
        Facility_Xero_Setting__c setting = new Facility_Xero_Setting__c(
            Name = 'Delete Test',
            Facility_Role__c = role.Id,
            Pay_Item_Type__c = 'Earnings',
            Xero_Payitem__c = 'delete-payitem',
            Xero_Payitem_Name__c = 'Delete Pay Item',
            Category__c = 'Morning',
            Shift_Type__c = 'Morning'
        );
        insert setting;
        
        Test.startTest();
        XeroSettingsController.deleteMultipleXeroSettings(setting.Id, orgId);
        Test.stopTest();
        
        System.assertEquals(0, [SELECT COUNT() FROM Facility_Xero_Setting__c WHERE Id = :setting.Id], 'Setting should be deleted.');
    }
    
    // ============================================================
    // TEST: deleteMultipleXeroSettings - VALIDATION
    // ============================================================
    @IsTest
    static void testDeleteMultipleXeroSettings_Validation() {
        Test.startTest();
        try {
            XeroSettingsController.deleteMultipleXeroSettings(null, getTestOrganisationId());
        } catch (AuraHandledException e) {
            System.debug(e.getMessage());
        }
        try {
            XeroSettingsController.deleteMultipleXeroSettings('invalid-id', null);
        } catch (AuraHandledException e) {
            System.debug(e.getMessage());
        }
        Test.stopTest();
    }
    
    // ============================================================
    // TEST: getEarningsRatesFromXero
    // ============================================================
    @IsTest
    static void testGetEarningsRatesFromXero() {
        Test.setMock(HttpCalloutMock.class, new XeroHttpMock());
        
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            Test.startTest();
            
            List<Map<String, String>> rates =
                XeroSettingsController.getEarningsRatesFromXero();
            
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: getReimbursementItemsFromXero
    // ============================================================
    @IsTest
    static void testGetReimbursementItemsFromXero() {
        Test.setMock(HttpCalloutMock.class, new XeroHttpMock());
        
        User testUser = getTestUser();
        
        System.runAs(testUser) {
            Test.startTest();
            
            List<Map<String, String>> items =
                XeroSettingsController.getReimbursementItemsFromXero();
            
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: addNewPayItem - NEW EARNINGS
    // ============================================================
    @IsTest
    static void testAddNewPayItem_NewEarnings() {
        Test.setMock(HttpCalloutMock.class, new XeroHttpMock());
        System.runAs(getTestUser()) {
            Test.startTest();
            XeroSettingsController.addNewPayItem('New Test Earnings Rate', 'Earnings');
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: addNewPayItem - EXISTING EARNINGS
    // ============================================================
    @IsTest
    static void testAddNewPayItem_ExistingEarnings() {
        Test.setMock(HttpCalloutMock.class, new XeroHttpMock());
        System.runAs(getTestUser()) {
            Test.startTest();
            XeroSettingsController.addNewPayItem('Existing Ordinary Hours', 'Earnings');
            Test.stopTest();
        }
    }
    
    // ============================================================
    // TEST: addNewPayItem - VALIDATION
    // ============================================================
    @IsTest
    static void testAddNewPayItem_Validation() {
        Test.startTest();
        try {
            XeroSettingsController.addNewPayItem(null, 'Earnings');
        } catch (AuraHandledException e) {
            System.debug(e.getMessage());
        }
        try {
            XeroSettingsController.addNewPayItem('', 'Earnings');
        } catch (AuraHandledException e) {
            System.debug(e.getMessage());
        }
        Test.stopTest();
    }
    
    // ============================================================
    // TEST: getXeroAccountIdByCode
    // ============================================================
    @IsTest
    static void testGetXeroAccountIdByCode() {
        Test.setMock(HttpCalloutMock.class, new XeroHttpMock());
        
        Test.startTest();
        String accountId = XeroSettingsController.getXeroAccountIdByCode('477', 'test-access-token', 'test-tenant-id');
        Test.stopTest();
        
        System.assertEquals('account-477', accountId, 'Should return the correct account ID.');
    }
    
    // ============================================================
    // TEST: getXeroAccountIdByCode - NOT FOUND
    // ============================================================
    @IsTest
    static void testGetXeroAccountIdByCode_NotFound() {
        Test.setMock(HttpCalloutMock.class, new XeroHttpMock());
        
        Test.startTest();
        String accountId = XeroSettingsController.getXeroAccountIdByCode('999', 'test-access-token', 'test-tenant-id');
        Test.stopTest();
        
        System.assertEquals(null, accountId, 'Should return null when account not found.');
    }
    
    // ============================================================
    // TEST: getPayItemIdByName
    // ============================================================
    @IsTest
    static void testGetPayItemIdByName() {
        Test.setMock(HttpCalloutMock.class, new XeroHttpMock());
        
        Test.startTest();
        String result = XeroSettingsController.getPayItemIdByName(
            'Existing Ordinary Hours',
            'test-access-token',
            'test-tenant-id',
            'Earnings'
        );
        Test.stopTest();
        
        System.assertEquals('existing-rate-001', result, 'Should return the correct payitem ID.');
    }
    
    // ============================================================
    // TEST: getPayItemIdByName - NOT FOUND
    // ============================================================
    @IsTest
    static void testGetPayItemIdByName_NotFound() {
        Test.setMock(HttpCalloutMock.class, new XeroHttpMock());
        
        Test.startTest();
        String result = XeroSettingsController.getPayItemIdByName(
            'NonExistent PayItem',
            'test-access-token',
            'test-tenant-id',
            'Earnings'
        );
        Test.stopTest();
        
        System.assertEquals(null, result, 'Should return null when payitem not found.');
    }
    
    // ============================================================
    // TEST: checkIfPayItemExists
    // ============================================================
    @IsTest
    static void testCheckIfPayItemExists() {
        Test.setMock(HttpCalloutMock.class, new XeroHttpMock());
        
        Test.startTest();
        Boolean exists = XeroSettingsController.checkIfPayItemExists(
            'Existing Ordinary Hours',
            'test-access-token',
            'test-tenant-id',
            'Earnings'
        );
        Boolean notExists = XeroSettingsController.checkIfPayItemExists(
            'NonExistent PayItem',
            'test-access-token',
            'test-tenant-id',
            'Earnings'
        );
        Test.stopTest();
        
        System.assertEquals(true, exists, 'PayItem should exist.');
        System.assertEquals(false, notExists, 'PayItem should not exist.');
    }
    
    // ============================================================
    // TEST: getSimilarPayItems
    // ============================================================
    @IsTest
    static void testGetSimilarPayItems() {
        Test.setMock(HttpCalloutMock.class, new XeroHttpMock());
        
        Test.startTest();
        List<String> similar = XeroSettingsController.getSimilarPayItems(
            'Ordinary',
            'test-access-token',
            'test-tenant-id',
            'Earnings'
        );
        Test.stopTest();
        
        System.assertNotEquals(null, similar, 'Similar items should not be null.');
    }
    
    // ============================================================
    // TEST: getPayItemId
    // ============================================================
    @IsTest
    static void testGetPayItemId() {
        Test.setMock(HttpCalloutMock.class, new XeroHttpMock());
        
        Test.startTest();
        String result = XeroSettingsController.getPayItemId(
            'Existing Ordinary Hours',
            'test-access-token',
            'test-tenant-id',
            'Earnings'
        );
        Test.stopTest();
        
        System.assertEquals('existing-rate-001', result, 'Should return the correct payitem ID.');
    }
    
    // ============================================================
    // TEST: getPayItemId - REIMBURSEMENT
    // ============================================================
    @IsTest
    static void testGetPayItemId_Reimbursement() {
        Test.setMock(HttpCalloutMock.class, new XeroHttpMock());
        
        Test.startTest();
        String result = XeroSettingsController.getPayItemId(
            'Reimbursement - Travel',
            'test-access-token',
            'test-tenant-id',
            'Reimbursement'
        );
        Test.stopTest();
        
        System.assertEquals('reimbursement-001', result, 'Should return the correct reimbursement ID.');
    }
    
    // ============================================================
    // MOCK: Xero No-ID (for fallback test)
    // ============================================================
    public class XeroNoIdMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            String ep = req.getEndpoint();
            
            if (ep.contains('identity.xero.com/connect/token')) {
                res.setStatusCode(200);
                res.setBody('{"access_token":"t","token_type":"Bearer","expires_in":1800}');
                return res;
            }
            if (ep.contains('/connections')) {
                res.setStatusCode(200);
                res.setBody('[{"tenantId":"test-tenant-001","tenantType":"ORGANISATION"}]');
                return res;
            }
            if (ep.contains('/api.xro/2.0/Accounts')) {
                res.setStatusCode(200);
                res.setBody('{"Accounts":[{"AccountID":"account-477","Code":"477"}]}');
                return res;
            }
            if (req.getMethod() == 'POST' && ep.contains('/payroll.xro/2.0/earningsRates')) {
                res.setStatusCode(201);
                res.setBody('{"name":"Fallback Item"}'); // no earningsRateID → fallback
                return res;
            }
            if (ep.contains('/payroll.xro/1.0/PayItems')) {
                res.setStatusCode(200);
                res.setBody('{"PayItems":{"EarningsRates":[]}}'); // empty → not found
                return res;
            }
            res.setStatusCode(404);
            res.setBody('{}');
            return res;
        }
    }
    
    // hits roleIds split + query-by-IDs + createEarningsSettings insert
    @IsTest
    static void testSaveEarnings_RoleIds() {
        Id orgId = [SELECT Id FROM Organisation__c LIMIT 1].Id;
        List<String> ids = new List<String>();
        for (Facility_Role__c r : [
            SELECT Id FROM Facility_Role__c WHERE Role_Name__c = 'Support Worker'
        ]) {
            ids.add(r.Id);
        }
        Test.startTest();
        XeroSettingsController.saveFacilityXeroSetting(
            orgId, 'Earnings', 'Support Worker', String.join(ids, ','),
            'xero-roleids-001', 'RoleIds Pay Item', 'Morning', 'General',
            null, null, null, null, null, null
        );
        Test.stopTest();
    }
    
    // hits per-role duplicate loop + Custom/customRate match branches
    @IsTest
    static void testSaveEarnings_DuplicateDetail() {
        Id orgId = [SELECT Id FROM Organisation__c LIMIT 1].Id;
        XeroSettingsController.saveFacilityXeroSetting(
            orgId, 'Earnings', 'Manager', null,
            'xero-dup-detail', 'Dup Detail', 'Afternoon', 'Custom',
            'General', null, null, null, null, 'General Rate 1'
        );
        Test.startTest();
        try {
            XeroSettingsController.saveFacilityXeroSetting(
                orgId, 'Earnings', 'Manager', null,
                'xero-dup-detail', 'Dup Detail', 'Afternoon', 'Custom',
                'General', null, null, null, null, 'General Rate 1'
            );
        } catch (Exception e) {}
        Test.stopTest();
    }
    
    // hits addNewPayItem fallback loop + wait loop + "ID could not be retrieved" throw
    @IsTest
    static void testAddNewPayItem_Fallback() {
        Test.setMock(HttpCalloutMock.class, new XeroNoIdMock());
        System.runAs(getTestUser()) {
            Test.startTest();
            try { XeroSettingsController.addNewPayItem('Fallback Item', 'Earnings'); }
            catch (Exception e) {}
            Test.stopTest();
        }
    }
    
    // ============================================================
    // MOCK: Xero Error
    // ============================================================
    public class XeroErrorMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            String ep = req.getEndpoint();
            if (ep.contains('identity.xero.com/connect/token')) {
                res.setStatusCode(200);
                res.setBody('{"access_token":"t","token_type":"Bearer","expires_in":1800}');
                return res;
            }
            if (ep.contains('/connections')) {
                res.setStatusCode(200);
                res.setBody('[{"tenantId":"test-tenant-001","tenantType":"ORGANISATION"}]');
                return res;
            }
            if (ep.contains('/api.xro/2.0/Accounts')) {
                res.setStatusCode(200);
                res.setBody('{"Accounts":[{"AccountID":"account-477","Code":"477"}]}');
                return res;
            }
            if (ep.contains('/payroll.xro/1.0/PayItems')) {
                res.setStatusCode(200);
                res.setBody('{"PayItems":{"EarningsRates":[]}}'); // pre-check finds nothing
                return res;
            }
            if (req.getMethod() == 'POST' && ep.contains('/payroll.xro/2.0/earningsRates')) {
                res.setStatusCode(500);
                res.setBody('{"error":"boom"}'); // → error block
                return res;
            }
            res.setStatusCode(404);
            res.setBody('{}');
            return res;
        }
    }
    
    @IsTest
    static void testAddNewPayItem_Error() {
        Test.setMock(HttpCalloutMock.class, new XeroErrorMock());
        System.runAs(getTestUser()) {
            Test.startTest();
            try { XeroSettingsController.addNewPayItem('Err Item', 'Earnings'); }
            catch (Exception e) {}
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testAddNewPayItem_Success() {
        Test.setMock(HttpCalloutMock.class, new XeroHttpMock());
        System.runAs(getTestUser()) {
            Test.startTest();
            XeroSettingsController.addNewPayItem('Brand New Rate XYZ', 'Earnings');
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testAddNewPayItem_ErrorStatus() {
        Test.setMock(HttpCalloutMock.class, new XeroErrMock());
        System.runAs(getTestUser()) {
            Test.startTest();
            try { XeroSettingsController.addNewPayItem('New Err Rate', 'Earnings'); }
            catch (Exception e) {}
            Test.stopTest();
        }
    }
    
    // ============================================================
    // MOCK: Xero Error Status
    // ============================================================
    public class XeroErrMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            String ep = req.getEndpoint();
            if (ep.contains('identity.xero.com/connect/token')) {
                res.setStatusCode(200);
                res.setBody('{"access_token":"t","token_type":"Bearer","expires_in":1800}');
                return res;
            }
            if (ep.contains('/connections')) {
                res.setStatusCode(200);
                res.setBody('[{"tenantId":"test-tenant-001","tenantType":"ORGANISATION"}]');
                return res;
            }
            if (ep.contains('/api.xro/2.0/Accounts')) {
                res.setStatusCode(200);
                res.setBody('{"Accounts":[{"AccountID":"account-477","Code":"477"}]}');
                return res;
            }
            if (ep.contains('/payroll.xro/1.0/PayItems')) {
                res.setStatusCode(200);
                res.setBody('{"PayItems":{"EarningsRates":[]}}');
                return res;
            }
            if (req.getMethod() == 'POST' && ep.contains('/payroll.xro/2.0/earningsRates')) {
                res.setStatusCode(500);              // → error else block
                res.setBody('{"Message":"fail"}');
                return res;
            }
            res.setStatusCode(404);
            res.setBody('{}');
            return res;
        }
    }
    
    @IsTest
    static void testSave_BrokenSleepover_Reimb() {
        Id orgId = [SELECT Id FROM Organisation__c LIMIT 1].Id;
        Test.startTest();
        // Broken TRUE branch (validation + field-set)
        XeroSettingsController.saveFacilityXeroSetting(
            orgId,'Earnings','Manager',null,'xero-brk','Brk Item','Night','Broken',
            null,'Fixed Rate',null,null,null,null);
        // Sleepover TRUE branch
        XeroSettingsController.saveFacilityXeroSetting(
            orgId,'Earnings','Manager',null,'xero-slp','Slp Item','Morning','Sleepover',
            null,null,'Fixed Rate',null,null,null);
        // Invalid Broken Type throw
        try {
            XeroSettingsController.saveFacilityXeroSetting(
                orgId,'Earnings','Manager',null,'xero-bad','Bad','Night','Broken',
                null,'BadType',null,null,null,null);
        } catch (Exception e) {}
        // Broken missing brokenType throw
        try {
            XeroSettingsController.saveFacilityXeroSetting(
                orgId,'Earnings','Manager',null,'xero-bad2','Bad2','Night','Broken',
                null,null,null,null,null,null);
        } catch (Exception e) {}
        // Sleepover missing type throw
        try {
            XeroSettingsController.saveFacilityXeroSetting(
                orgId,'Earnings','Manager',null,'xero-bad3','Bad3','Night','Sleepover',
                null,null,null,null,null,null);
        } catch (Exception e) {}
        // Reimbursement then getAll → hits N/A roleName + facilityNames branch
        XeroSettingsController.saveFacilityXeroSetting(
            orgId,'Reimbursement',null,null,'xero-rmb','Reimbursement - X',
            null,null,null,null,null,null,null,null);
        XeroSettingsController.getAllXeroSettings(orgId);
        Test.stopTest();
    }
    
    @IsTest
    static void testUpdate_BrokenSleepover() {
        Id orgId = [SELECT Id FROM Organisation__c LIMIT 1].Id;
        Facility_Role__c role = [
            SELECT Id FROM Facility_Role__c WHERE Role_Name__c = 'Manager' LIMIT 1
        ];
        Facility_Xero_Setting__c s = new Facility_Xero_Setting__c(
            Name='U', Facility_Role__c=role.Id, Pay_Item_Type__c='Earnings',
            Xero_Payitem__c='u-pay', Xero_Payitem_Name__c='U Pay',
            Category__c='Morning', Shift_Type__c='General');
        insert s;
        Test.startTest();
        // update → Broken branch
        XeroSettingsController.updateFacilityXeroSetting(
            orgId, s.Id,'Earnings','Manager',null,'u-pay','U Pay','Night','Broken',
            null,'Fixed Rate',null,null,null,null);
        // update → Sleepover branch
        XeroSettingsController.updateFacilityXeroSetting(
            orgId, s.Id,'Earnings','Manager',null,'u-pay','U Pay','Morning','Sleepover',
            null,null,'Fixed Rate',null,null,null);
        Test.stopTest();
    }
}