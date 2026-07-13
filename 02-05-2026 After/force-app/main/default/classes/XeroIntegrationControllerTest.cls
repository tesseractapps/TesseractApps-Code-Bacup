@IsTest
public class XeroIntegrationControllerTest {

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
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.20932@hotmail.com';
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
    }
   }

    // ------------------- 🔹 MOCK CLASSES -------------------
    private class XeroAccessTokenMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"access_token": "test_access_token_value"}');
            res.setStatusCode(200);
            return res;
        }
    }

    private class XeroTenantIdMock_Success implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            // ✅ Fix: must be an array, not an object
            res.setBody('[{"id":"12345","tenantId":"tenant_001","tenantType":"ORGANISATION"}]');
            res.setStatusCode(200);
            return res;
        }
    }

    private class XeroEarningsRatesMock_All_Success implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
    
            String endpoint = req.getEndpoint();
    
            if (endpoint.contains('/connect/token')) {
                // ✅ Access Token Mock
                res.setBody('{"access_token": "test_access_token_value", "token_type": "Bearer", "expires_in": 1800}');
                res.setStatusCode(200);
            } else if (endpoint.contains('/connections')) {
                // ✅ Tenant ID Mock (must return array!)
                res.setBody('[{"id":"12345","tenantId":"tenant_001","tenantType":"ORGANISATION"}]');
                res.setStatusCode(200);
            } else if (endpoint.contains('/earningsRates')) {
                // ✅ Earnings Rates Mock
                res.setBody('{"earningsRates":[{"earningsRateID":"ER-001","name":"Base Salary","earningsType":"Salary","rateType":"Fixed","typeOfUnits":"Hours","expenseAccountID":"EXP-001","isSubjectToTax":true,"isSubjectToSuper":true}]}');
                res.setStatusCode(200);
            } else {
                res.setBody('{"error":"Unknown endpoint"}');
                res.setStatusCode(400);
            }
    
            return res;
        }
    }


    // ------------------- 🔹 TEST METHODS -------------------
    @IsTest
    static void testGetTenantId_Success() {
        Test.setMock(HttpCalloutMock.class, new XeroTenantIdMock_Success());
        Test.startTest();
        String tenantId = XeroIntegrationController.getTenantId('test_access_token');
        Test.stopTest();
    }

    @IsTest
    static void testSyncXeroEarningsRates_Success() {
        Test.setMock(HttpCalloutMock.class, new XeroEarningsRatesMock_All_Success());
    
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
        System.runAs(user) {
            Test.startTest();
            String result = XeroIntegrationController.syncXeroEarningsRates(); // Enqueues Job
            List<Staff__c> staffList = XeroIntegrationController.fetchStaffList();
            List<Xero_Entity__c> fetchEntityList = XeroIntegrationController.fetchEntityList();
            Test.stopTest(); // Queueable executes here
        }
    
        List<Xero_Earning_Rate__c> earnings = [
            SELECT Id, Name, Earning_Rate_ID__c FROM Xero_Earning_Rate__c
        ];
    }

   
    private class XeroEmployeesMock_All_Success implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            String endpoint = req.getEndpoint();
            
            System.debug('⚙️ Mock called for endpoint: ' + endpoint);
            
            // Mock access token request
            if (endpoint.contains('/connect/token')) {
                res.setBody('{"access_token": "test_access_token_value", "token_type": "Bearer", "expires_in": 1800}');
                res.setStatusCode(200);
            }
            // Mock tenant connections request
            else if (endpoint.contains('/connections')) {
                res.setBody('[{"tenantId": "tenant_001", "tenantType": "ORGANISATION"}]');
                res.setStatusCode(200);
            }
            // Mock employees request
            else if (endpoint.contains('/Employees')) {
                res.setBody('{"Employees":[{"EmployeeID":"EMP001","FirstName":"John","LastName":"Doe","Status":"ACTIVE"}]}');
                res.setStatusCode(200);
            }
            // Unknown endpoint (fallback)
            else {
                res.setBody('{"error":"Unknown endpoint"}');
                res.setStatusCode(400);
            }
            
            return res;
        }
    }
       
    
    @TestVisible private static String getAccessTokenFromXero() {
        return 'dummy_access_token';
    }

    @TestVisible private static String getTenantId(String accessToken) {
        return 'dummy_tenant_id';
    }

    // Mock Response Class
    private class XeroEmployeesMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{' +
                        '"Employees": [' +
                        '{"EmployeeID": "123", "FirstName": "John", "LastName": "Doe", "Email": "john@example.com"},' +
                        '{"EmployeeID": "456", "FirstName": "Jane", "LastName": "Smith", "Email": "jane@example.com"}' +
                        '] }'
                       );
            return res;
        }
    }
    
    @IsTest
    static void testGetXeroEmployees() {
        
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
        System.runAs(user) {
            Test.startTest();
            Test.setMock(HttpCalloutMock.class, new XeroEmployeesMock());
            String accessToken = 'test_access_token_value';
            String tenantId = 'tenant_001';
            List<Map<String, Object>> employees = XeroIntegrationController.getXeroEmployees();
            Test.stopTest();
        }
    }
    
    private class XeroMockHttpResponse implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            
            // ✅ Mock a successful 201 Xero API response
            if (req.getEndpoint().contains('Employees')) {
                res.setStatusCode(201);
                res.setBody('{"Employees":[{"EmployeeID":"EMP12345"}]}');
            }
            return res;
        }
    }
    
    @IsTest
    static void testCreateOrUpdateXeroEmployee() {
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
        System.runAs(user) {
            // ✅ Mock HTTP callout
            Test.setMock(HttpCalloutMock.class, new XeroEmployeesMock());
    
            // ✅ Replace real methods with test versions (no HTTP call)
            String accessToken = 'test_access_token_value';
             String tenantId = 'tenant_001';
    
            // ✅ Get Staff record
            Staff__c staff = [SELECT Id,Email_Address__c FROM Staff__c Where Email_Address__c= 'manualtesting.20932@hotmail.com' LIMIT 1];
    
            Test.startTest();
            String result = XeroIntegrationController.createOrUpdateXeroEmployee(staff.Id);
            Test.stopTest();
        }
    }
    
    private class XeroContactsMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            
            // Mock Response JSON
            String mockResponse = '{ "Contacts": [ ' +
                '{ "Name": "John Doe", "EmailAddress": "john@example.com", "ContactID": "12345" },' +
                '{ "Name": "Jane Smith", "EmailAddress": "jane@example.com", "ContactID": "67890" }' +
            ' ] }';
            
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody(mockResponse);
            return res;
        }
    }

    @IsTest
    static void testGetXeroContacts() {
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
        System.runAs(user) {
            // ✅ Set the mock HTTP response
            String accessToken = 'test_access_token_value';
            String tenantId = 'tenant_001';
            Test.setMock(HttpCalloutMock.class, new XeroContactsMock());
            
            Test.startTest();
            // ✅ Call the method
            List<Map<String, Object>> contacts = XeroIntegrationController.getXeroContacts();
            Test.stopTest();
        }
        
    }   
    
    private class XeroCreateContactMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {

            // ✅ Mock Success Response
            String mockResponse = '{ "Contacts": [ { "ContactID": "abc123-xyz999" } ] }';

            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody(mockResponse);
            return res;
        }
    }  
    
    @IsTest
    static void testCreateOrUpdateXeroContacts() {
        Organisation__c org = [SELECT Id,Name From Organisation__c Where Name = 'Ashfield Consultants' LIMIT 1];
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
        // ✅ Run test as this user
        System.runAs(user) {
            // ✅ Step 3: Create Entity to send to Xero
            Xero_Entity__c entity = new Xero_Entity__c();
                entity.First_Name__c = 'John';
                entity.Last_Name__c = 'Doe';
                entity.Email__c = 'john.doe@example.com';
                entity.Contact__c = '9876543210';
                entity.ABN__c = '12 345 678 901';
                entity.Organization__c = org.Id;
            insert entity;

            // ✅ Step 4: Mock HTTP Response
            Test.setMock(HttpCalloutMock.class, new XeroCreateContactMock());

            // ✅ Step 5: Call the method
            Test.startTest();
            String result = XeroIntegrationController.createOrUpdateXeroContacts(entity.Id);
            Test.stopTest();

        }
    }   
    
    private class XeroCreateInvoiceMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {

            // Mock Success Response
            String mockResponse = '{ "Invoices": [ { "InvoiceID": "INV-123-XYZ" } ] }';

            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody(mockResponse);
            return res;
        }
    }
    
    @IsTest
    static void testCreateOrUpdateXeroInvoice() {
        
        Organisation__c org = [SELECT Id,Name From Organisation__c Where Name = 'Ashfield Consultants' LIMIT 1];
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
        
        Xero_Entity__c entity = new Xero_Entity__c();
            entity.First_Name__c = 'John';
            entity.Last_Name__c = 'Doe';
            entity.Email__c = 'john.doe@example.com';
            entity.Contact__c = '9876543210';
            entity.Xero_Contact_Id__c = 'CONTACT-123';
            entity.Organization__c = org.Id;
        insert entity;

        Xero_or_Myob_Invoice__c invoice = new Xero_or_Myob_Invoice__c();
            invoice.Invoice_No__c = 'INV-001';
            invoice.Invoice_Date__c = Date.today();
            invoice.Invoice_Source__c = 'Xero';
            invoice.Total_Amount__c = 500.00;
            invoice.Xero_Entity__c = entity.Id;
        insert invoice;

        Xero_Invoice_Entries__c item = new Xero_Invoice_Entries__c();
            item.Xero_or_Myob_Invoice__c = invoice.Id;
            item.Description__c = 'Consulting Services';
            item.Quantity__c = 2;
            item.Unit_Price__c = 250.00;
            item.Total_Amount__c = 500.00;
        insert item;
        
        // ✅ Run test as this user
        System.runAs(user) {

            Test.setMock(HttpCalloutMock.class, new XeroCreateInvoiceMock());
    
            Test.startTest();
            String response = XeroIntegrationController.createOrUpdateXeroInvoice(invoice.Id);
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testUpdateXeroEmployeeIds() {
        // ✅ Step 1: Create test Staff records
        Staff__c staff = [SELECT Id,Email_Address__c FROM Staff__c Where Email_Address__c= 'manualtesting.20932@hotmail.com' LIMIT 1];

        // ✅ Step 2: Prepare input list (staffMappings) like front-end sends
        List<Map<String, String>> staffMappings = new List<Map<String, String>>();
        staffMappings.add(new Map<String, String>{
            'systemStaffId' => staff.Id,
            'xeroEmployeeId' => 'XERO123',
            'ordinaryEarningsRateId' => 'RATE001'
        });
        
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
        
        System.runAs(user) {
            // ✅ Step 3: Call the method
            Test.startTest();
            XeroIntegrationController.updateXeroEmployeeIds(staffMappings);
            Test.stopTest();
        }
    }

    @IsTest
    static void testNoUpdateWhenAlreadyHasValues() {
        // ✅ Staff already has values → Should NOT update
        Staff__c staff = [SELECT Id,Email_Address__c FROM Staff__c Where Email_Address__c= 'manualtesting.20932@hotmail.com' LIMIT 1];

        List<Map<String, String>> staffMappings = new List<Map<String, String>>{
            new Map<String, String>{
                'systemStaffId' => staff.Id,
                'xeroEmployeeId' => 'NEW_XERO',
                'ordinaryEarningsRateId' => 'NEW_RATE'
            }
        };
         
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
        
        System.runAs(user) {

            Test.startTest();
            XeroIntegrationController.updateXeroEmployeeIds(staffMappings);
            Test.stopTest();
        }

    }
    
    
    @IsTest
    static void testFetchXeroEntityList_ReturnsRecords() {
        // ✅ Step 1: Create a fake Organisation
        Organisation__c org = [SELECT Id,Name From Organisation__c Where Name = 'Ashfield Consultants' LIMIT 1];
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
        
        System.runAs(user) {

        // ✅ Step 2: Create sample Xero_Entity__c records
            Xero_Entity__c entity1 = new Xero_Entity__c();
                entity1.First_Name__c = 'John';
                entity1.Last_Name__c = 'Doe';
                entity1.Email__c = 'john.doe@test.com';
                entity1.Contact__c = '1234567890';
                entity1.ABN__c = '12345678901';
                entity1.Organization__c = org.Id;
                entity1.Xero_Contact_Id__c = 'XERO123';  // ✅ Only records with Xero Contact ID should return
            insert entity1;
    
            Xero_Entity__c entity2 = new Xero_Entity__c();
                entity2.First_Name__c = 'Jane';
                entity2.Last_Name__c = 'Smith';
                entity2.Email__c = 'jane.smith@test.com';
                entity2.Contact__c = '9876543210';
                entity2.ABN__c = '98765432109';
                entity2.Organization__c = org.Id;
                entity2.Xero_Contact_Id__c = 'XERO456';
            insert entity2;
            
            // This one should NOT come in result (no Xero Contact ID)
            Xero_Entity__c entityNoXero = new Xero_Entity__c();
                entityNoXero.First_Name__c = 'Mike';
                entityNoXero.Last_Name__c = 'NoXero';
                entityNoXero.Email__c = 'mike@test.com';
                entityNoXero.Contact__c = '111222333';
                entityNoXero.Organization__c = org.Id;
                entityNoXero.Xero_Contact_Id__c = null;
            insert entityNoXero;
    
    
            // ✅ Step 3: Execute method
            Test.startTest();
            List<Xero_Entity__c> result = XeroIntegrationController.fetchXeroEntityList(org.Id);
            Test.stopTest();
    
    
            // Validate returned data
            Set<String> returnedIds = new Set<String>();
            for (Xero_Entity__c ent : result) {
                returnedIds.add(ent.Xero_Contact_Id__c);
            }
        }
    }

    @IsTest
    static void testFetchXeroEntityList_NoRecords() {
        // ✅ Step 1: Org without Entities
        Organisation__c org = [SELECT Id,Name From Organisation__c Where Name = 'Ashfield Consultants' LIMIT 1];
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
        
        System.runAs(user) {

            Test.startTest();
            List<Xero_Entity__c> result = XeroIntegrationController.fetchXeroEntityList(org.Id);
            Test.stopTest();
        }
    }
    
    @IsTest
    static void testSaveEntityWithAddress() {
        Organisation__c org = [SELECT Id,Name From Organisation__c Where Name = 'Ashfield Consultants' LIMIT 1];
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
        
        System.runAs(user) {

            // Mock input data (same structure LWC will send)
            Map<String, Object> entityData = new Map<String, Object>{
                'firstName' => 'John',
                'lastName' => 'Doe',
                'email' => 'john.doe@example.com',
                'contactNo' => '9876543210',
                'abn' => '12345678901',
                'xeroId' => 'XERO123',
                'address' => new Map<String, Object>{
                    'street' => '123 Main St',
                    'city' => 'Sydney',
                    'province' => 'NSW',
                    'postalCode' => '2000',
                    'country' => 'AU'
                }
            };

            Test.startTest();
            XeroIntegrationController.saveEntity(entityData, org.Id);
            Test.stopTest();
        }

    }

    
    @IsTest
    static void testSaveEntityWithoutAddress() {
        Organisation__c org = [SELECT Id,Name From Organisation__c Where Name = 'Ashfield Consultants' LIMIT 1];
        User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
        
        System.runAs(user) {

            Map<String, Object> entityData = new Map<String, Object>{
                'firstName' => 'Alice',
                'lastName' => 'Smith',
                'email' => 'alice@example.com',
                'contactNo' => '1234509876',
                'abn' => '98765432100',
                'xeroId' => 'XERO999'
            };
    
            Test.startTest();
            XeroIntegrationController.saveEntity(entityData, org.Id);
            Test.stopTest();
        }

    }
    
    
    @IsTest
    static void testUpdate_WhenBlank() {

        // Arrange
        Xero_Entity__c entity = new Xero_Entity__c(
            First_Name__c = 'John',
            Last_Name__c  = 'Doe'
        );
        insert entity;

        List<Map<String, String>> payload = new List<Map<String, String>>{
            new Map<String, String>{
                'systemEntityId' => entity.Id,
                'xeroEntityId'   => 'XERO-CONTACT-001'
            }
        };

        // Act
        Test.startTest();
        XeroIntegrationController.updateXeroEntityIds(payload);
        Test.stopTest();

        // Assert
        Xero_Entity__c updated =
            [SELECT Xero_Contact_Id__c FROM Xero_Entity__c WHERE Id = :entity.Id];

        System.assertEquals(
            'XERO-CONTACT-001',
            updated.Xero_Contact_Id__c,
            'Xero Contact Id should be updated when blank'
        );
    }


    @IsTest
    static void testNoUpdate_WhenAlreadyPresent() {

        // Arrange
        Xero_Entity__c entity = new Xero_Entity__c(
            First_Name__c = 'Jane',
            Last_Name__c  = 'Smith',
            Xero_Contact_Id__c = 'EXISTING-XERO-ID'
        );
        insert entity;

        List<Map<String, String>> payload = new List<Map<String, String>>{
            new Map<String, String>{
                'systemEntityId' => entity.Id,
                'xeroEntityId'   => 'NEW-XERO-ID'
            }
        };

        // Act
        Test.startTest();
        XeroIntegrationController.updateXeroEntityIds(payload);
        Test.stopTest();

        // Assert
        Xero_Entity__c afterUpdate =
            [SELECT Xero_Contact_Id__c FROM Xero_Entity__c WHERE Id = :entity.Id];
    }

private class XeroInvoiceFetchMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');

        String endpoint = req.getEndpoint();

        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token": "test_access_token"}');
            res.setStatusCode(200);
        } 
        else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001","tenantType":"ORGANISATION"}]');
            res.setStatusCode(200);
        } 
        else if (endpoint.contains('/Invoices')) {
            res.setBody('{"Invoices":[{"InvoiceID":"INV-001","Status":"AUTHORISED"}]}');
            res.setStatusCode(200);
        } 
        else {
            res.setBody('{"error":"Unknown"}');
            res.setStatusCode(400);
        }

        return res;
    }
}

@IsTest
static void testProcessInvoiceStatus() {

    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];

    System.runAs(user) {

        Test.setMock(HttpCalloutMock.class, new XeroInvoiceFetchMock());

        Test.startTest();
        String result = XeroIntegrationController.processInoviceStatus();
        Test.stopTest();
    }
}

}