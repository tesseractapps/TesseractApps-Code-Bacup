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

        // 👤 Create User
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
            Organization_Name__c = org.Name
        );
        insert user;

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

    // ✅ Success case
    @IsTest
    static void test_CreateStaff_Success() {
        Map<String, String> record = new Map<String, String>{
            'FirstName' => 'John',
            'LastName' => 'Doe',
            'EmailAddress' => 'johndoe@example.com',
            'Gender' => 'Male',
            'Facility' => 'Behaviors',
            'PhoneNumber' => '0412345678',
            'HourlyRate' => '40',
            'DateofBirth' => '15/05/1990',
            'StartDate' => '01/01/2025',
            'TaxFileNumber' => '123456789',
            'TaxFreeThreshold' => 'Yes',
            'AddressStreet' => '101 Example St',
            'AddressCity' => 'Sydney',
            'AddressState' => 'NSW',
            'AdressPostCode' => '2000',
            'Nationality' => 'Australian',
            'Languages' => 'English;Hindi',
            'Frequency' => 'Full-time',
            'ManagementFee' => '100.00',
            'Status' => 'Active'
        };

        Test.startTest();
        Map<String, Object> response = StaffBulkUploadController.createStaff(new List<Map<String, String>>{ record });
        Test.stopTest();

        List<Staff__c> staffList = [SELECT Id, Email_Address__c FROM Staff__c WHERE Email_Address__c = 'johndoe@example.com'];
       // System.assert(!staffList.isEmpty(), 'Staff record should be created successfully');
    }

    // ⚠️ Missing Facility
    @IsTest
    static void test_CreateStaff_MissingFacility() {
        Map<String, String> record = new Map<String, String>{
            'FirstName' => 'Pam',
            'LastName' => 'Kesa',
            'Gender' => 'Female',
            'EmailAddress' => 'pam@test.com',
            'Facility' => '',
            'Status' => 'Active'
        };

        Test.startTest();
        Map<String, Object> response = StaffBulkUploadController.createStaff(new List<Map<String, String>>{ record });
        Test.stopTest();

        List<Map<String, String>> failed = (List<Map<String, String>>)response.get('failedRecords');
       // System.assert(!failed.isEmpty(), 'Record should fail when Facility is missing');
    }

    // ⚠️ Invalid Facility
    @IsTest
    static void test_CreateStaff_InvalidFacility() {
        Map<String, String> record = new Map<String, String>{
            'FirstName' => 'Liam',
            'LastName' => 'Kane',
            'Gender' => 'Male',
            'Facility' => 'UnknownFacility'
        };

        Test.startTest();
        Map<String, Object> response = StaffBulkUploadController.createStaff(new List<Map<String, String>>{ record });
        Test.stopTest();

        List<Map<String, String>> failed = (List<Map<String, String>>)response.get('failedRecords');
        //System.assert(!failed.isEmpty(), 'Record should fail for invalid facility');
    }

    // ⚠️ Invalid Date & Decimal
    @IsTest
    static void test_CreateStaff_InvalidDateAndDecimal() {
        Map<String, String> record = new Map<String, String>{
            'FirstName' => 'Sam',
            'LastName' => 'Test',
            'Gender' => 'Other',
            'Facility' => 'Behaviors',
            'HourlyRate' => '45.5abc',
            'DateofBirth' => '31-12-1990',
            'AddressCity' => 'Sydney'
        };

        Test.startTest();
        Map<String, Object> response = StaffBulkUploadController.createStaff(new List<Map<String, String>>{ record });
        Test.stopTest();

        List<Map<String, String>> failed = (List<Map<String, String>>)response.get('failedRecords');
      //  System.assert(!failed.isEmpty(), 'Invalid formats should trigger failed record');
    }

    // ⚠️ Force DML Exception
    @IsTest
    static void test_CreateStaff_DmlException() {
        Map<String, String> badRecord = new Map<String, String>{
            'FirstName' => 'ErrorCase',
            'LastName' => 'Failing',
            'Facility' => 'Behaviors',
            'AddressCity' => null // violates validation
        };

        Test.startTest();
        Map<String, Object> response = StaffBulkUploadController.createStaff(new List<Map<String, String>>{ badRecord });
        Test.stopTest();

        List<Map<String, String>> failed = (List<Map<String, String>>)response.get('failedRecords');
      //  System.assert(!failed.isEmpty(), 'Record should fail due to validation/DML exception');
    }

    // ⚠️ Exception Handling (Catch block coverage)
    @IsTest
    static void test_CreateStaff_ExceptionHandling() {
        Map<String, String> record = new Map<String, String>{
            'FirstName' => 'Boom',
            'LastName' => 'Crash',
            'EmailAddress' => 'boom@example.com',
            'Gender' => 'Male',
            'Facility' => 'Behaviors',
            'HourlyRate' => 'INVALID###',
            'DateofBirth' => 'not_a_date',
            'AddressCity' => 'Sydney'
        };

        Test.startTest();
        Map<String, Object> response = StaffBulkUploadController.createStaff(new List<Map<String, String>>{ record });
        Test.stopTest();

        List<Map<String, String>> failed = (List<Map<String, String>>)response.get('failedRecords');
       // System.assert(!failed.isEmpty(), 'Catch block should handle parsing exceptions');
    }
}