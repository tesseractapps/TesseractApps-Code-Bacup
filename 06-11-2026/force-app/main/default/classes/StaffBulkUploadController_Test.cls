@IsTest
private class StaffBulkUploadController_Test {

    @TestSetup
    static void setupTestData() {
        // 🏢 Create Organisation
        Organisation__c org = new Organisation__c(
            Name = 'Ashfield Consultants',
            ABN__c = '11234567891',
            ACN__c = '878787878',
            Contact_No__c = '6132899740',
            RCTI__c = 'RCTI1',
            Email__c = 'org@test.com',
            Bank__c = 'Test Bank',
            BSB__c = '123456',
            Account_Name__c = 'Test Account',
            Account_Number__c = '1111111111',
            Description__c = 'Test organisation record',
            Address_Latest__Street__s = '101 Example St',
            Address_Latest__City__s = 'Sydney',
            Address_Latest__PostalCode__s = '2000',
            Address_Latest__CountryCode__s = 'AU',
            Address_Latest__StateCode__s = 'NSW',
            NDIS_Provider__c = '12341234565',
            BMSI_Identifier__c = 'TEST BMSI',
            SoftwareId__c = 'jhdfn18328',
            Branch_code__c = 'BS123',
            Contact_Name__c = 'Test Contact',
            User_Type__c = 'NDIS Org Admin'
        );
        insert org;

        // 👤 Create User with correct Organisation reference
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'testuser',
            Email = 'manualtesting.20294637@hotmail.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'BulkTester',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'manualtesting.20294637+user@test.com',
            Organization_Name__c = 'Ashfield Consultants'  // Must match Organisation Name
        );
        insert user;

        // Create facilities as the user
        System.runAs(user) {
            // ✅ Facilities for testing
            Facility__c behaviors = new Facility__c(
                Name = 'Behaviors',
                Address__City__s = 'Sydney',
                Address__Street__s = '100 George St',
                Address__StateCode__s = 'NSW',
                Address__PostalCode__s = '2000',
                Address__CountryCode__s = 'AU',
                Email__c = 'behaviors@test.com',
                Status__c = true,
                Organisation__c = org.Id,
                ABN__c = '11111111111',
                Phone__c = '0412345678'
            );
            insert behaviors;

            Facility__c fac = new Facility__c(
                Name = 'Ashfield Consultants',
                Address__City__s = 'Crace',
                Address__Street__s = '8 Keewong Street',
                Address__StateCode__s = 'ACT',
                Address__PostalCode__s = '2911',
                Address__CountryCode__s = 'AU',
                Email__c = 'testonefacility@gmail.com',
                Status__c = true,
                Organisation__c = org.Id,
                ABN__c = '12345566666',
                Phone__c = '12323432'
            );
            insert fac;
        }
    }

    // ✅ Test 1: Basic successful creation
    @IsTest
    static void test_BasicSuccess() {
        // Get the test user
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            Map<String, String> record = new Map<String, String>();
            record.put('FirstName', 'John');
            record.put('LastName', 'Doe');
            record.put('EmailAddress', 'john.doe@test.com');
            record.put('Facility', 'Behaviors');
            record.put('Status', 'Active');
            record.put('PhoneNumber', '0412345678');
            record.put('AddressCity', 'Sydney');
            record.put('AddressState', 'NSW');
            records.add(record);

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 2: Multiple records with different facilities
    @IsTest
    static void test_MultipleRecords_DifferentFacilities() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            Map<String, String> record1 = new Map<String, String>();
            record1.put('FirstName', 'John');
            record1.put('LastName', 'Doe');
            record1.put('EmailAddress', 'john.doe@test.com');
            record1.put('Facility', 'Behaviors');
            record1.put('Status', 'Active');
            records.add(record1);
            
            Map<String, String> record2 = new Map<String, String>();
            record2.put('FirstName', 'Jane');
            record2.put('LastName', 'Smith');
            record2.put('EmailAddress', 'jane.smith@test.com');
            record2.put('Facility', 'Ashfield Consultants');
            record2.put('Status', 'Active');
            records.add(record2);

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 3: Record with blank facility
    @IsTest
    static void test_BlankFacility() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            Map<String, String> record = new Map<String, String>();
            record.put('FirstName', 'Blank');
            record.put('LastName', 'Facility');
            record.put('EmailAddress', 'blank.facility@test.com');
            record.put('Facility', '');
            record.put('Status', 'Active');
            records.add(record);

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 4: Record with null facility
    @IsTest
    static void test_NullFacility() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            Map<String, String> record = new Map<String, String>();
            record.put('FirstName', 'Null');
            record.put('LastName', 'Facility');
            record.put('EmailAddress', 'null.facility@test.com');
            record.put('Facility', null);
            record.put('Status', 'Active');
            records.add(record);

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 5: Record with invalid facility
    @IsTest
    static void test_InvalidFacility() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            Map<String, String> record = new Map<String, String>();
            record.put('FirstName', 'Invalid');
            record.put('LastName', 'Facility');
            record.put('EmailAddress', 'invalid.facility@test.com');
            record.put('Facility', 'NonExistentFacility');
            record.put('Status', 'Active');
            records.add(record);

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 6: Mixed records
    @IsTest
    static void test_MixedRecords() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            Map<String, String> record1 = new Map<String, String>();
            record1.put('FirstName', 'Valid');
            record1.put('LastName', 'User');
            record1.put('EmailAddress', 'valid.user@test.com');
            record1.put('Facility', 'Behaviors');
            record1.put('Status', 'Active');
            records.add(record1);
            
            Map<String, String> record2 = new Map<String, String>();
            record2.put('FirstName', 'Blank');
            record2.put('LastName', 'Facility');
            record2.put('EmailAddress', 'blank.facility@test.com');
            record2.put('Facility', '');
            record2.put('Status', 'Active');
            records.add(record2);
            
            Map<String, String> record3 = new Map<String, String>();
            record3.put('FirstName', 'Null');
            record3.put('LastName', 'Facility');
            record3.put('EmailAddress', 'null.facility@test.com');
            record3.put('Facility', null);
            record3.put('Status', 'Active');
            records.add(record3);
            
            Map<String, String> record4 = new Map<String, String>();
            record4.put('FirstName', 'Invalid');
            record4.put('LastName', 'Facility');
            record4.put('EmailAddress', 'invalid.facility@test.com');
            record4.put('Facility', 'NonExistent');
            record4.put('Status', 'Active');
            records.add(record4);

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 7: All state codes
    @IsTest
    static void test_AllStateCodes() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            List<String> states = new List<String>{
                'new south wales', 'nsw', 'victoria', 'vic', 'queensland', 'qld',
                'western', 'wa', 'south australia', 'sa', 'tasmania', 'tas',
                'capital', 'act', 'northern', 'nt'
            };
            
            Integer i = 1;
            for (String state : states) {
                Map<String, String> record = new Map<String, String>();
                record.put('FirstName', 'State' + i);
                record.put('LastName', 'Test');
                record.put('EmailAddress', 'state' + i + '@test.com');
                record.put('Facility', 'Behaviors');
                record.put('AddressState', state);
                record.put('Status', 'Active');
                records.add(record);
                i++;
            }

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 8: All status values
    @IsTest
    static void test_AllStatusValues() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            List<String> statuses = new List<String>{'Active', 'true', 'Yes', 'Inactive', 'false', 'No'};
            
            Integer i = 1;
            for (String status : statuses) {
                Map<String, String> record = new Map<String, String>();
                record.put('FirstName', 'Status' + i);
                record.put('LastName', 'Test');
                record.put('EmailAddress', 'status' + i + '@test.com');
                record.put('Facility', 'Behaviors');
                record.put('Status', status);
                records.add(record);
                i++;
            }

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 9: Duplicate emails
    @IsTest
    static void test_DuplicateEmails() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            Map<String, String> record1 = new Map<String, String>();
            record1.put('FirstName', 'First');
            record1.put('LastName', 'User');
            record1.put('EmailAddress', 'duplicate@test.com');
            record1.put('Facility', 'Behaviors');
            record1.put('Status', 'Active');
            records.add(record1);
            
            Map<String, String> record2 = new Map<String, String>();
            record2.put('FirstName', 'Second');
            record2.put('LastName', 'User');
            record2.put('EmailAddress', 'duplicate@test.com');
            record2.put('Facility', 'Behaviors');
            record2.put('Status', 'Active');
            records.add(record2);

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 10: All fields populated
    @IsTest
    static void test_AllFieldsPopulated() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            Map<String, String> record = new Map<String, String>();
            record.put('FirstName', 'Full');
            record.put('LastName', 'Record');
            record.put('EmailAddress', 'full.record@test.com');
            record.put('Gender', 'Male');
            record.put('Facility', 'Behaviors');
            record.put('PhoneNumber', '0412345678');
            record.put('HourlyRate', '50.00');
            record.put('DateofBirth', '15/05/1990');
            record.put('StartDate', '01/01/2025');
            record.put('TaxFileNumber', '123456789');
            record.put('TaxFreeThreshold', 'Yes');
            record.put('AddressStreet', '101 Example St');
            record.put('AddressCity', 'Sydney');
            record.put('AddressState', 'NSW');
            record.put('AdressPostCode', '2000');
            record.put('Nationality', 'Australian');
            record.put('Languages', 'English;Hindi');
            record.put('Frequency', 'Full-time');
            record.put('ManagementFee', '100.00');
            record.put('Status', 'Active');
            record.put('AccountName', 'Test Account');
            record.put('BSB', '123456');
            record.put('AccountNumber', '1111111111');
            record.put('AustralianBusinessNumber', '12345678901');
            records.add(record);

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 11: Empty records list
    @IsTest
    static void test_EmptyRecords() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> emptyRecords = new List<Map<String, String>>();

            Test.startTest();
            StaffBulkUploadController.createStaff(emptyRecords);
            Test.stopTest();
        }
    }

    // ✅ Test 12: Invalid decimals
    @IsTest
    static void test_InvalidDecimals() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            Map<String, String> record = new Map<String, String>();
            record.put('FirstName', 'Decimal');
            record.put('LastName', 'Test');
            record.put('EmailAddress', 'decimal.test@test.com');
            record.put('Facility', 'Behaviors');
            record.put('HourlyRate', '45.5abc');
            record.put('ManagementFee', 'abc');
            record.put('Status', 'Active');
            records.add(record);

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 13: Invalid dates
    @IsTest
    static void test_InvalidDates() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            Map<String, String> record = new Map<String, String>();
            record.put('FirstName', 'Date');
            record.put('LastName', 'Test');
            record.put('EmailAddress', 'date.test@test.com');
            record.put('Facility', 'Behaviors');
            record.put('DateofBirth', '31-12-1990');
            record.put('StartDate', '2025/01/01');
            record.put('Status', 'Active');
            records.add(record);

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 14: Helper - parseDecimal
    @IsTest
    static void test_ParseDecimal() {
        StaffBulkUploadController.parseDecimal(null);
        StaffBulkUploadController.parseDecimal('');
        StaffBulkUploadController.parseDecimal('abc');
        StaffBulkUploadController.parseDecimal('100.50');
        StaffBulkUploadController.parseDecimal('1,000.00');
        StaffBulkUploadController.parseDecimal('1,000.50');
    }

    // ✅ Test 15: Helper - parseDDMMYYYY
    @IsTest
    static void test_ParseDDMMYYYY() {
        StaffBulkUploadController.parseDDMMYYYY(null);
        StaffBulkUploadController.parseDDMMYYYY('');
        StaffBulkUploadController.parseDDMMYYYY('abc');
        StaffBulkUploadController.parseDDMMYYYY('31-12-2020');
        StaffBulkUploadController.parseDDMMYYYY('31/12/2020');
        StaffBulkUploadController.parseDDMMYYYY('01/01/2025');
    }

    // ✅ Test 16: Bulk records
    @IsTest
    static void test_BulkRecords() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            for (Integer i = 1; i <= 50; i++) {
                Map<String, String> record = new Map<String, String>();
                record.put('FirstName', 'Bulk' + i);
                record.put('LastName', 'User');
                record.put('EmailAddress', 'bulk' + i + '@test.com');
                record.put('Facility', 'Behaviors');
                record.put('Status', (Math.mod(i, 2) == 0) ? 'Active' : 'Inactive');
                records.add(record);
            }

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 17: Special characters
    @IsTest
    static void test_SpecialCharacters() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            Map<String, String> record = new Map<String, String>();
            record.put('FirstName', 'O\'Brien');
            record.put('LastName', 'Smith-Jones');
            record.put('EmailAddress', 'special@test.com');
            record.put('Facility', 'Behaviors');
            record.put('AddressStreet', '123 Main St, Apt 4B');
            record.put('AddressCity', 'Sydney CBD');
            record.put('Languages', 'English;Spanish;Mandarin');
            record.put('Status', 'Active');
            records.add(record);

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }

    // ✅ Test 18: Unknown state code
    @IsTest
    static void test_UnknownStateCode() {
        User testUser = [SELECT Id, Organization_Name__c FROM User WHERE Email = 'manualtesting.20294637@hotmail.com' LIMIT 1];
        
        System.runAs(testUser) {
            List<Map<String, String>> records = new List<Map<String, String>>();
            
            Map<String, String> record = new Map<String, String>();
            record.put('FirstName', 'Unknown');
            record.put('LastName', 'State');
            record.put('EmailAddress', 'unknown.state@test.com');
            record.put('Facility', 'Behaviors');
            record.put('AddressState', 'UnknownState');
            record.put('Status', 'Active');
            records.add(record);

            Test.startTest();
            StaffBulkUploadController.createStaff(records);
            Test.stopTest();
        }
    }
}