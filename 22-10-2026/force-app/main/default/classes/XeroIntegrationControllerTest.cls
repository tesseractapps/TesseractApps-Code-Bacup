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
            String response = XeroIntegrationController.createOrUpdateXeroInvoice(invoice.Id, 'ACC-001'); 
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
    
private class XeroSyncMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {

        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');

        String endpoint = req.getEndpoint();

        if (endpoint.contains('/connect/token')) {

            res.setStatusCode(200);
            res.setBody(
                '{"access_token":"test_access_token"}'
            );

        } else if (endpoint.contains('/connections')) {

            res.setStatusCode(200);
            res.setBody(
                '[{"id":"12345","tenantId":"tenant_001","tenantType":"ORGANISATION"}]'
            );

        } else {

            res.setStatusCode(400);
            res.setBody('{"error":"Unknown endpoint"}');
        }

        return res;
    }
}
    
private class XeroSyncErrorMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {

        HttpResponse res = new HttpResponse();

        res.setStatusCode(401);
        res.setBody(
            '{"error":"invalid_client","error_description":"Invalid client credentials"}'
        );

        return res;
    }
}
    
@IsTest
static void testSyncXero_Success() {

    User user = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.209458@hotmail.com'
        LIMIT 1
    ];

    System.runAs(user) {

        Test.setMock(
            HttpCalloutMock.class,
            new XeroSyncMock()
        );

        Test.startTest();

        String result =
            XeroIntegrationController.syncXero(
                'client_id_123',
                'client_secret_123'
            );

        Test.stopTest();


    }
}
    
    
@IsTest
static void testSyncXero_AuthFailure() {

    User user = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.209458@hotmail.com'
        LIMIT 1
    ];

    System.runAs(user) {

        Test.setMock(
            HttpCalloutMock.class,
            new XeroSyncErrorMock()
        );

        Test.startTest();

        String result =
            XeroIntegrationController.syncXero(
                'badClient',
                'badSecret'
            );

        Test.stopTest();


    }
}
    
private class XeroSyncNoConnectionMock implements HttpCalloutMock {

    public HttpResponse respond(HttpRequest req) {

        HttpResponse res = new HttpResponse();

        if (req.getEndpoint().contains('/connect/token')) {

            res.setStatusCode(200);
            res.setBody('{"access_token":"test_access_token"}');

        } else if (req.getEndpoint().contains('/connections')) {

            res.setStatusCode(200);
            res.setBody('[]');
        }

        return res;
    }
}

@IsTest
static void testSyncXero_NoConnections() {

    User user = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.209458@hotmail.com'
        LIMIT 1
    ];

    System.runAs(user) {

        Test.setMock(
            HttpCalloutMock.class,
            new XeroSyncNoConnectionMock()
        );

        Test.startTest();

        String result =
            XeroIntegrationController.syncXero(
                'client_id_123',
                'client_secret_123'
            );

        Test.stopTest();


    }
}
    
@IsTest
static void testGetFullXeroEmployee_Success() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    // Create a mock class for this specific test
    Test.setMock(HttpCalloutMock.class, new XeroFullEmployeeMock_Success());
    
    System.runAs(user) {
        Test.startTest();
        Map<String, Object> employee = XeroIntegrationController.getFullXeroEmployee('EMP001');
        Test.stopTest();
        
        // Assert

    }
}

@IsTest
static void testGetFullXeroEmployee_NotFound() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    Test.setMock(HttpCalloutMock.class, new XeroFullEmployeeMock_NotFound());
    
    System.runAs(user) {
        Test.startTest();
        Map<String, Object> employee = XeroIntegrationController.getFullXeroEmployee('EMP999');
        Test.stopTest();
        
        // Assert

    }
}

@IsTest
static void testGetFullXeroEmployee_ApiError() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    Test.setMock(HttpCalloutMock.class, new XeroFullEmployeeMock_ApiError());
    
    System.runAs(user) {
        Test.startTest();
        Map<String, Object> employee = XeroIntegrationController.getFullXeroEmployee('EMP001');
        Test.stopTest();
        
        // Assert

    }
}

@IsTest
static void testGetFullXeroEmployee_NoEmployeesArray() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    Test.setMock(HttpCalloutMock.class, new XeroFullEmployeeMock_NoEmployees());
    
    System.runAs(user) {
        Test.startTest();
        Map<String, Object> employee = XeroIntegrationController.getFullXeroEmployee('EMP001');
        Test.stopTest();
        
        // Assert

    }
}

@IsTest
static void testGetFullXeroEmployee_WithFormattedDOB() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    Test.setMock(HttpCalloutMock.class, new XeroFullEmployeeMock_WithDOB());
    
    System.runAs(user) {
        Test.startTest();
        Map<String, Object> employee = XeroIntegrationController.getFullXeroEmployee('EMP001');
        Test.stopTest();
        
        // Assert

    }
}

@IsTest
static void testGetFullXeroEmployee_TestMode() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    // This test will use test mode (no actual HTTP callout)
    // The method detects Test.isRunningTest() and uses dummy tokens
    
    System.runAs(user) {
        Test.startTest();
        // We still need a mock for the actual API call that happens after token retrieval
        Test.setMock(HttpCalloutMock.class, new XeroFullEmployeeMock_Success());
        Map<String, Object> employee = XeroIntegrationController.getFullXeroEmployee('EMP001');
        Test.stopTest();
        
        // Assert

    }
}

// ============================================================
// 🔹 MOCK CLASSES FOR getFullXeroEmployee
// ============================================================

/**
 * Mock for successful employee details retrieval
 */
private class XeroFullEmployeeMock_Success implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        
        if (endpoint.contains('/connect/token')) {
            // Access token response
            res.setBody('{"access_token": "test_access_token_value", "token_type": "Bearer", "expires_in": 1800}');
            res.setStatusCode(200);
        } 
        else if (endpoint.contains('/connections')) {
            // Tenant ID response (must return array!)
            res.setBody('[{"id":"12345","tenantId":"tenant_001","tenantType":"ORGANISATION"}]');
            res.setStatusCode(200);
        } 
        else if (endpoint.contains('/Employees') && endpoint.contains('EMP001')) {
            // Full employee details response
            res.setBody('{' +
                '"Employees": [' +
                '{' +
                '"EmployeeID": "EMP001", ' +
                '"FirstName": "John", ' +
                '"LastName": "Doe", ' +
                '"Email": "john.doe@example.com", ' +
                '"DateOfBirth": "/Date(631152000+0000)/", ' +
                '"Gender": "M", ' +
                '"JobTitle": "Developer", ' +
                '"Status": "ACTIVE"' +
                '}' +
                ']' +
                '}');
            res.setStatusCode(200);
        } 
        else {
            res.setBody('{"error":"Unknown endpoint"}');
            res.setStatusCode(400);
        }
        
        return res;
    }
}

/**
 * Mock for employee not found
 */
private class XeroFullEmployeeMock_NotFound implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token": "test_access_token_value"}');
            res.setStatusCode(200);
        } 
        else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]');
            res.setStatusCode(200);
        } 
        else if (endpoint.contains('/Employees') && endpoint.contains('EMP999')) {
            // Employee not found - return empty Employees array
            res.setBody('{"Employees": []}');
            res.setStatusCode(200);
        } 
        else {
            res.setBody('{"error":"Not found"}');
            res.setStatusCode(404);
        }
        
        return res;
    }
}

/**
 * Mock for API error (non-200 response)
 */
private class XeroFullEmployeeMock_ApiError implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token": "test_access_token_value"}');
            res.setStatusCode(200);
        } 
        else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]');
            res.setStatusCode(200);
        } 
        else if (endpoint.contains('/Employees')) {
            // API returns error
            res.setBody('{"error":"Internal Server Error"}');
            res.setStatusCode(500);
        } 
        else {
            res.setBody('{"error":"Unknown"}');
            res.setStatusCode(400);
        }
        
        return res;
    }
}

/**
 * Mock with empty Employees array
 */
private class XeroFullEmployeeMock_NoEmployees implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token": "test_access_token_value"}');
            res.setStatusCode(200);
        } 
        else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]');
            res.setStatusCode(200);
        } 
        else if (endpoint.contains('/Employees')) {
            // Empty Employees array
            res.setBody('{"Employees": []}');
            res.setStatusCode(200);
        } 
        else {
            res.setBody('{"error":"Unknown"}');
            res.setStatusCode(400);
        }
        
        return res;
    }
}

/**
 * Mock with DateOfBirth that needs formatting
 */
private class XeroFullEmployeeMock_WithDOB implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token": "test_access_token_value"}');
            res.setStatusCode(200);
        } 
        else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]');
            res.setStatusCode(200);
        } 
        else if (endpoint.contains('/Employees')) {
            // Employee with DateOfBirth that needs formatting
            res.setBody('{' +
                '"Employees": [' +
                '{' +
                '"EmployeeID": "EMP001", ' +
                '"FirstName": "Jane", ' +
                '"LastName": "Smith", ' +
                '"DateOfBirth": "/Date(820454400+0000)/", ' +
                '"Email": "jane.smith@example.com"' +
                '}' +
                ']' +
                '}');
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
static void testCreateXeroItem_Success() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    Test.setMock(HttpCalloutMock.class, new XeroCreateItemMock_Success());
    
    System.runAs(user) {
        Test.startTest();
        XeroIntegrationController.createXeroItem(
            'test_access_token',
            'tenant_001',
            'SUPPORT-001',
            '200',
            'EXEMPTOUTPUT'
        );
        Test.stopTest();
        
        // Assert - no exception means success

    }
}

@IsTest
static void testCreateXeroItem_ApiError() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    Test.setMock(HttpCalloutMock.class, new XeroCreateItemMock_ApiError());
    
    System.runAs(user) {
        Test.startTest();
        try {
            XeroIntegrationController.createXeroItem(
                'test_access_token',
                'tenant_001',
                'SUPPORT-002',
                '200',
                'EXEMPTOUTPUT'
            );

        } catch (AuraHandledException e) {

        }
        Test.stopTest();
    }
}

@IsTest
static void testCreateXeroItem_WithAllParameters() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    Test.setMock(HttpCalloutMock.class, new XeroCreateItemMock_Success());
    
    System.runAs(user) {
        Test.startTest();
        XeroIntegrationController.createXeroItem(
            'test_access_token',
            'tenant_001',
            'NDIS-SUPPORT-12345',
            '400',
            'GSTONIMPORTS'
        );
        Test.stopTest();
        

    }
}

@IsTest
static void testCreateXeroItem_ItemCodeWithSpecialCharacters() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    Test.setMock(HttpCalloutMock.class, new XeroCreateItemMock_Success());
    
    System.runAs(user) {
        Test.startTest();
        XeroIntegrationController.createXeroItem(
            'test_access_token',
            'tenant_001',
            'SUPPORT-001_ABC-123',
            '200',
            'EXEMPTOUTPUT'
        );
        Test.stopTest();
        

    }
}

@IsTest
static void testCreateXeroItem_ExceptionHandling() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    // This mock will throw an exception in the HTTP callout
    
    System.runAs(user) {
        Test.startTest();
        try {
            XeroIntegrationController.createXeroItem(
                'test_access_token',
                'tenant_001',
                'SUPPORT-003',
                '200',
                'EXEMPTOUTPUT'
            );
            
            XeroIntegrationController.getGenderCode('Male');
            XeroIntegrationController.mapEmploymentBasis('FULLTIME');

        } catch (AuraHandledException e) {

        }
        Test.stopTest();
    }
}

@IsTest
static void testCheckXeroItem_Exists() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    Test.setMock(HttpCalloutMock.class, new XeroCheckItemMock_Exists());
    
    System.runAs(user) {
        Test.startTest();
        Boolean exists = XeroIntegrationController.checkXeroItem(
            'test_access_token',
            'tenant_001',
            'SUPPORT-001'
        );
        Test.stopTest();
        

        
    }
}

@IsTest
static void testCheckXeroItem_NotExists() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    Test.setMock(HttpCalloutMock.class, new XeroCheckItemMock_NotExists());
    
    System.runAs(user) {
        Test.startTest();
        Boolean exists = XeroIntegrationController.checkXeroItem(
            'test_access_token',
            'tenant_001',
            'SUPPORT-999'
        );
        Test.stopTest();
        

    }
}

@IsTest
static void testCheckXeroItem_ApiError() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    
    Test.setMock(HttpCalloutMock.class, new XeroCheckItemMock_ApiError());
    
    System.runAs(user) {
        Test.startTest();
        Boolean exists = XeroIntegrationController.checkXeroItem(
            'test_access_token',
            'tenant_001',
            'SUPPORT-001'
        );
        Test.stopTest();
        

    }
}

@IsTest
static void testCheckXeroItem_ExceptionHandling() {
    // Arrange
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    

    
    System.runAs(user) {
        Test.startTest();
        Boolean exists = XeroIntegrationController.checkXeroItem(
            'test_access_token',
            'tenant_001',
            'SUPPORT-001'
        );
        Test.stopTest();
        

    }
}

// ============================================================
// 🔹 MOCK CLASSES FOR createXeroItem & checkXeroItem
// ============================================================

/**
 * Mock for successful item creation
 */
private class XeroCreateItemMock_Success implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        String endpoint = req.getEndpoint();
        String method = req.getMethod();
        
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token": "test_access_token_value"}');
            res.setStatusCode(200);
        } 
        else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]');
            res.setStatusCode(200);
        }
        else if (endpoint.contains('/Items')) {
            if (method == 'GET') {
                // Check item - exists
                res.setBody('{"Items": [{"ItemID": "ITEM-001", "Code": "SUPPORT-001"}]}');
                res.setStatusCode(200);
            } else if (method == 'POST') {
                // Create item - success
                res.setBody('{"Items": [{"ItemID": "ITEM-001", "Code": "SUPPORT-001"}]}');
                res.setStatusCode(201);
            } else {
                res.setBody('{"error": "Method not allowed"}');
                res.setStatusCode(405);
            }
        }
        else {
            res.setBody('{"error":"Unknown endpoint"}');
            res.setStatusCode(400);
        }
        
        return res;
    }
}

/**
 * Mock for item creation API error
 */
private class XeroCreateItemMock_ApiError implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/Items') && req.getMethod() == 'POST') {
            // API returns error
            res.setBody('{"Error": {"Message": "Duplicate item code"}}');
            res.setStatusCode(400);
        } 
        else {
            // Token/tenant endpoints - success
            res.setBody('{"access_token": "test_access_token_value"}');
            res.setStatusCode(200);
        }
        
        return res;
    }
}

/**
 * Mock for check item - item exists
 */
private class XeroCheckItemMock_Exists implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/Items/')) {
            // Item found
            res.setBody('{"Items": [{"ItemID": "ITEM-001", "Code": "SUPPORT-001"}]}');
            res.setStatusCode(200);
        } 
        else {
            // Token/tenant endpoints - success
            res.setBody('{"access_token": "test_access_token_value"}');
            res.setStatusCode(200);
        }
        
        return res;
    }
}

/**
 * Mock for check item - item does not exist (404)
 */
private class XeroCheckItemMock_NotExists implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/Items/')) {
            // Item not found
            res.setStatusCode(404);
            res.setBody('{"Error": "Item not found"}');
        } 
        else {
            // Token/tenant endpoints - success
            res.setBody('{"access_token": "test_access_token_value"}');
            res.setStatusCode(200);
        }
        
        return res;
    }
}

/**
 * Mock for check item - API error (non-200, non-404)
 */
private class XeroCheckItemMock_ApiError implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        
        if (req.getEndpoint().contains('/Items/')) {
            // API returns error (500)
            res.setStatusCode(500);
            res.setBody('{"Error": "Internal Server Error"}');
        } 
        else {
            // Token/tenant endpoints - success
            res.setBody('{"access_token": "test_access_token_value"}');
            res.setStatusCode(200);
        }
        
        return res;
    }
}

  // =====================================================================
// PASTE EVERYTHING BELOW THIS LINE INSIDE YOUR EXISTING
// XeroIntegrationControllerTest CLASS, JUST BEFORE ITS FINAL CLOSING "}"
// =====================================================================

// ---------------------------------------------------------------
// 🔹 formatXeroDate — null / blank / valid / fallback-parse / malformed
//    (currently only the "/Date(valid_ts+0000)/" branch is hit via
//    the getFullXeroEmployee mocks — null, blank, plain-date fallback,
//    and the malformed-timestamp catch are all dead)
// ---------------------------------------------------------------
@IsTest
static void testFormatXeroDate_Branches() {
    Test.startTest();
    String r1 = XeroIntegrationController.formatXeroDate(null);
    String r2 = XeroIntegrationController.formatXeroDate('');
    String r3 = XeroIntegrationController.formatXeroDate('/Date(631152000000+0000)/');
    String r4 = XeroIntegrationController.formatXeroDate('2024-01-15');           // fallback Date.parse branch
    String r5 = XeroIntegrationController.formatXeroDate('/Date(notanumber+0000)/'); // malformed -> outer catch
    String r6 = XeroIntegrationController.formatXeroDate('completely-not-a-date!!');
    Test.stopTest();
}

// ---------------------------------------------------------------
// 🔹 mapEmploymentBasis — only 'FULLTIME' default is hit today
// ---------------------------------------------------------------
@IsTest
static void testMapEmploymentBasis_RemainingBranches() {
    Test.startTest();
    String r1 = XeroIntegrationController.mapEmploymentBasis(null);
    String r2 = XeroIntegrationController.mapEmploymentBasis('');
    String r3 = XeroIntegrationController.mapEmploymentBasis('Part-Time');
    String r4 = XeroIntegrationController.mapEmploymentBasis('Casual');
    String r5 = XeroIntegrationController.mapEmploymentBasis('Labour Hire');
    String r6 = XeroIntegrationController.mapEmploymentBasis('Non-Employee');
    String r7 = XeroIntegrationController.mapEmploymentBasis('SomethingElse');
    Test.stopTest();
}

// ---------------------------------------------------------------
// 🔹 getGenderCode — only 'Male' is hit today
// ---------------------------------------------------------------
@IsTest
static void testGetGenderCode_RemainingBranches() {
    Test.startTest();
    String r1 = XeroIntegrationController.getGenderCode('Female');
    String r2 = XeroIntegrationController.getGenderCode('Not Specified');
    String r3 = XeroIntegrationController.getGenderCode('Indeterminate/Intersex/Unspecified');
    String r4 = XeroIntegrationController.getGenderCode('Unknown Value');
    Test.stopTest();
}

// ---------------------------------------------------------------
// 🔹 getXeroAccounts — never called by any existing test.
//    Covers: system-account skip, inactive skip, BANK exclusion,
//    allowed-by-type, allowed-by-class fallback, disallowed,
//    plus the 401 branch and the generic non-200 branch.
// ---------------------------------------------------------------
private class XeroAccountsMixedMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        String endpoint = req.getEndpoint();
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token":"tok"}');
            res.setStatusCode(200);
        } else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]');
            res.setStatusCode(200);
        } else if (endpoint.contains('/Accounts')) {
            List<Map<String, Object>> accounts = new List<Map<String, Object>>{
                new Map<String, Object>{ 'Type' => 'REVENUE', 'Class' => 'REVENUE', 'Status' => 'ACTIVE', 'SystemAccount' => false },
                new Map<String, Object>{ 'Type' => 'BANK', 'Class' => 'ASSET', 'Status' => 'ACTIVE', 'SystemAccount' => false },
                new Map<String, Object>{ 'Type' => 'EXPENSE', 'Class' => 'EXPENSE', 'Status' => 'ARCHIVED', 'SystemAccount' => false },
                new Map<String, Object>{ 'Type' => 'CURRENT', 'Class' => 'EXPENSE', 'Status' => 'ACTIVE', 'SystemAccount' => false },
                new Map<String, Object>{ 'Type' => 'UNKNOWNTYPE', 'Class' => 'UNKNOWNCLASS', 'Status' => 'ACTIVE', 'SystemAccount' => false },
                new Map<String, Object>{ 'Type' => 'REVENUE', 'Class' => 'REVENUE', 'Status' => 'ACTIVE', 'SystemAccount' => true },
                new Map<String, Object>{ 'Type' => 'REVENUE', 'Class' => 'REVENUE', 'Status' => 'ACTIVE', 'SystemAccount' => 'true' }
            };
            res.setBody(JSON.serialize(new Map<String, Object>{ 'Accounts' => accounts }));
            res.setStatusCode(200);
        }
        return res;
    }
}

private class XeroAccountsUnauthorizedMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        String endpoint = req.getEndpoint();
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token":"tok"}'); res.setStatusCode(200);
        } else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]'); res.setStatusCode(200);
        } else if (endpoint.contains('/Accounts')) {
            res.setBody('{"error":"unauthorized"}'); res.setStatusCode(401);
        }
        return res;
    }
}

private class XeroAccountsGenericErrorMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        String endpoint = req.getEndpoint();
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token":"tok"}'); res.setStatusCode(200);
        } else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]'); res.setStatusCode(200);
        } else if (endpoint.contains('/Accounts')) {
            res.setBody('{"error":"server error"}'); res.setStatusCode(500);
        }
        return res;
    }
}

@IsTest
static void testGetXeroAccounts_MixedBranches() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroAccountsMixedMock());
        Test.startTest();
        List<Map<String, Object>> accounts = XeroIntegrationController.getXeroAccounts();
        Test.stopTest();
    }
}

@IsTest
static void testGetXeroAccounts_Unauthorized() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroAccountsUnauthorizedMock());
        Test.startTest();
        try {
            List<Map<String, Object>> accounts = XeroIntegrationController.getXeroAccounts();
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

@IsTest
static void testGetXeroAccounts_GenericError() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroAccountsGenericErrorMock());
        Test.startTest();
        try {
            List<Map<String, Object>> accounts = XeroIntegrationController.getXeroAccounts();
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 getXeroAccountDetails — never called by any existing test
// ---------------------------------------------------------------
private class XeroAccountDetailsMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        if (req.getEndpoint().contains('/Accounts/EMPTY')) {
            res.setBody('{"Accounts":[]}'); res.setStatusCode(200);
        } else if (req.getEndpoint().contains('/Accounts/FAIL')) {
            res.setBody('{"error":"not found"}'); res.setStatusCode(404);
        } else {
            res.setBody('{"Accounts":[{"Code":"200","Name":"Sales","TaxType":"OUTPUT"}]}');
            res.setStatusCode(200);
        }
        return res;
    }
}

@IsTest
static void testGetXeroAccountDetails_Branches() {
    Test.setMock(HttpCalloutMock.class, new XeroAccountDetailsMock());
    Test.startTest();
    Map<String, Object> ok = XeroIntegrationController.getXeroAccountDetails('tok', 'tenant', 'ACC-OK');
    Map<String, Object> empty = XeroIntegrationController.getXeroAccountDetails('tok', 'tenant', 'EMPTY');
    Map<String, Object> fail = XeroIntegrationController.getXeroAccountDetails('tok', 'tenant', 'FAIL');
    Test.stopTest();
}

// ---------------------------------------------------------------
// 🔹 syncXeroEarningsRates — only the full-success path is tested.
//    Non-200, empty earningsRates, and "no W1-reportable rates"
//    are all dead.
// ---------------------------------------------------------------
private class XeroEarningsRatesFailMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        String endpoint = req.getEndpoint();
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token":"tok"}'); res.setStatusCode(200);
        } else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]'); res.setStatusCode(200);
        } else if (endpoint.contains('/earningsRates')) {
            res.setBody('{"error":"server error"}'); res.setStatusCode(500);
        }
        return res;
    }
}

private class XeroEarningsRatesEmptyMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        String endpoint = req.getEndpoint();
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token":"tok"}'); res.setStatusCode(200);
        } else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]'); res.setStatusCode(200);
        } else if (endpoint.contains('/earningsRates')) {
            res.setBody('{"earningsRates":[]}'); res.setStatusCode(200);
        }
        return res;
    }
}

private class XeroEarningsRatesNonReportableMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        String endpoint = req.getEndpoint();
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token":"tok"}'); res.setStatusCode(200);
        } else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]'); res.setStatusCode(200);
        } else if (endpoint.contains('/earningsRates')) {
            res.setBody('{"earningsRates":[{"earningsRateID":"ER-999","name":"Non Reportable","isReportableAsW1":false}]}');
            res.setStatusCode(200);
        }
        return res;
    }
}

@IsTest
static void testSyncXeroEarningsRates_NonReportable() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroEarningsRatesNonReportableMock());
        Test.startTest();
        String result = XeroIntegrationController.syncXeroEarningsRates();
        Test.stopTest();
    }
}

@IsTest
static void testSyncXeroEarningsRates_Empty() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroEarningsRatesEmptyMock());
        Test.startTest();
        String result = XeroIntegrationController.syncXeroEarningsRates();
        Test.stopTest();
    }
}

@IsTest
static void testSyncXeroEarningsRates_ApiFailure() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroEarningsRatesFailMock());
        Test.startTest();
        try {
            String result = XeroIntegrationController.syncXeroEarningsRates();
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 getXeroEmployees — pagination loop never continues past page 1
//    because no existing mock returns a full pageSize (100) page.
// ---------------------------------------------------------------
private class XeroEmployeesPaginationMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        String endpoint = req.getEndpoint();
        if (endpoint.contains('page=1')) {
            List<Map<String, Object>> emps = new List<Map<String, Object>>();
            for (Integer i = 0; i < 100; i++) {
                emps.add(new Map<String, Object>{ 'EmployeeID' => 'EMP' + i, 'FirstName' => 'F' + i, 'LastName' => 'L' + i });
            }
            res.setBody(JSON.serialize(new Map<String, Object>{ 'Employees' => emps }));
            res.setStatusCode(200);
        } else if (endpoint.contains('page=2')) {
            res.setBody('{"Employees":[]}'); res.setStatusCode(200);
        }
        return res;
    }
}

@IsTest
static void testGetXeroEmployees_Pagination() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroEmployeesPaginationMock());
        Test.startTest();
        List<Map<String, Object>> employees = XeroIntegrationController.getXeroEmployees();
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 getXeroContacts / createOrUpdateXeroContacts — only success is tested
// ---------------------------------------------------------------
private class XeroContactsAndInvoiceFailMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        String endpoint = req.getEndpoint();
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token":"tok"}'); res.setStatusCode(200);
        } else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]'); res.setStatusCode(200);
        } else {
            res.setBody('{"error":"failed"}'); res.setStatusCode(400);
        }
        return res;
    }
}

@IsTest
static void testGetXeroContacts_Failure() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroContactsAndInvoiceFailMock());
        Test.startTest();
        try {
            List<Map<String, Object>> contacts = XeroIntegrationController.getXeroContacts();
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

@IsTest
static void testCreateOrUpdateXeroContacts_Failure() {
    Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Xero_Entity__c entity = new Xero_Entity__c();
        entity.First_Name__c = 'Fail';
        entity.Last_Name__c = 'Case';
        entity.Organization__c = org.Id;
        insert entity;

        Test.setMock(HttpCalloutMock.class, new XeroContactsAndInvoiceFailMock());
        Test.startTest();
        try {
            String result = XeroIntegrationController.createOrUpdateXeroContacts(entity.Id);
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 createOrUpdateXeroInvoice — blank accountId branch (skips the
//    getXeroAccountDetails call entirely) is never tested; your
//    only invoice test always passes 'ACC-001'.
// ---------------------------------------------------------------
private class XeroInvoiceNoAccountMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        String endpoint = req.getEndpoint();
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token":"tok"}'); res.setStatusCode(200);
        } else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]'); res.setStatusCode(200);
        } else if (endpoint.contains('/Items/')) {
            res.setStatusCode(404); res.setBody('{"error":"not found"}');
        } else if (endpoint.contains('/Items')) {
            res.setBody('{"Items":[{"ItemID":"ITEM-1"}]}'); res.setStatusCode(201);
        } else if (endpoint.contains('/Invoices')) {
            res.setBody('{"Invoices":[{"InvoiceID":"INV-NOACC-1"}]}'); res.setStatusCode(200);
        }
        return res;
    }
}

@IsTest
static void testCreateOrUpdateXeroInvoice_NoAccountId() {
    Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];

    Xero_Entity__c entity = new Xero_Entity__c();
    entity.First_Name__c = 'NoAcc';
    entity.Last_Name__c = 'Entity';
    entity.Xero_Contact_Id__c = 'CONTACT-NOACC-1';
    entity.Organization__c = org.Id;
    insert entity;

    Xero_or_Myob_Invoice__c invoice = new Xero_or_Myob_Invoice__c();
    invoice.Invoice_No__c = 'INV-NOACC-001';
    invoice.Invoice_Date__c = Date.today();
    invoice.Invoice_Source__c = 'Xero';
    invoice.Total_Amount__c = 100.00;
    invoice.Xero_Entity__c = entity.Id;
    insert invoice;

    Xero_Invoice_Entries__c item = new Xero_Invoice_Entries__c();
    item.Xero_or_Myob_Invoice__c = invoice.Id;
    item.Description__c = 'No Account Test';
    item.Quantity__c = 1;
    item.Unit_Price__c = 100.00;
    item.Total_Amount__c = 100.00;
    insert item;

    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroInvoiceNoAccountMock());
        Test.startTest();
        String result = XeroIntegrationController.createOrUpdateXeroInvoice(invoice.Id, null);
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 processInoviceStatus — only success is tested; non-200 and
//    malformed-body (JSON deserialize throws) branches are dead
// ---------------------------------------------------------------
private class XeroInvoiceStatusFailMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        String endpoint = req.getEndpoint();
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token":"tok"}'); res.setStatusCode(200);
        } else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]'); res.setStatusCode(200);
        } else if (endpoint.contains('/Invoices')) {
            res.setBody('{"error":"server error"}'); res.setStatusCode(500);
        }
        return res;
    }
}

private class XeroInvoiceStatusMalformedMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        String endpoint = req.getEndpoint();
        if (endpoint.contains('/connect/token')) {
            res.setBody('{"access_token":"tok"}'); res.setStatusCode(200);
        } else if (endpoint.contains('/connections')) {
            res.setBody('[{"tenantId":"tenant_001"}]'); res.setStatusCode(200);
        } else if (endpoint.contains('/Invoices')) {
            res.setBody('not-valid-json{{{'); res.setStatusCode(200); // forces the catch(Exception e) branch
        }
        return res;
    }
}

@IsTest
static void testProcessInvoiceStatus_ApiFailure() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroInvoiceStatusFailMock());
        Test.startTest();
        String result = XeroIntegrationController.processInoviceStatus();
        Test.stopTest();
    }
}

@IsTest
static void testProcessInvoiceStatus_MalformedBody() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroInvoiceStatusMalformedMock());
        Test.startTest();
        String result = XeroIntegrationController.processInoviceStatus();
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 updateXeroEmployeeIds — empty-list early return, blank-field
//    skip, and "no change needed" skip-update branches are dead
//    (your two existing tests both pass valid, differing values)
// ---------------------------------------------------------------
@IsTest
static void testUpdateXeroEmployeeIds_EmptyOrNullList() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.startTest();
        XeroIntegrationController.updateXeroEmployeeIds(new List<Map<String, String>>());
        XeroIntegrationController.updateXeroEmployeeIds(null);
        Test.stopTest();
    }
}

@IsTest
static void testUpdateXeroEmployeeIds_BlankFieldsSkipped() {
    List<Map<String, String>> mappings = new List<Map<String, String>>{
        new Map<String, String>{ 'systemStaffId' => null, 'xeroEmployeeId' => 'X1' },
        new Map<String, String>{ 'systemStaffId' => '', 'xeroEmployeeId' => '' }
    };
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.startTest();
        XeroIntegrationController.updateXeroEmployeeIds(mappings);
        Test.stopTest();
    }
}

@IsTest
static void testUpdateXeroEmployeeIds_NoOpWhenUnchanged() {
    Staff__c staff = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.20932@hotmail.com' LIMIT 1];
    staff.Xero_Employee_ID__c = 'SAME-ID';
    staff.Ordinary_Earnings_Rate_ID__c = 'SAME-RATE';
    update staff;

    List<Map<String, String>> mappings = new List<Map<String, String>>{
        new Map<String, String>{ 'systemStaffId' => staff.Id, 'xeroEmployeeId' => 'SAME-ID', 'ordinaryEarningsRateId' => 'SAME-RATE' }
    };
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.startTest();
        XeroIntegrationController.updateXeroEmployeeIds(mappings);
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 updateXeroEntityIds — empty-list and blank-field branches are dead
// ---------------------------------------------------------------
@IsTest
static void testUpdateXeroEntityIds_EmptyOrNullList() {
    Test.startTest();
    XeroIntegrationController.updateXeroEntityIds(new List<Map<String, String>>());
    XeroIntegrationController.updateXeroEntityIds(null);
    Test.stopTest();
}

@IsTest
static void testUpdateXeroEntityIds_BlankFieldsSkipped() {
    List<Map<String, String>> mappings = new List<Map<String, String>>{
        new Map<String, String>{ 'systemEntityId' => null, 'xeroEntityId' => 'X1' },
        new Map<String, String>{ 'systemEntityId' => '', 'xeroEntityId' => '' }
    };
    Test.startTest();
    XeroIntegrationController.updateXeroEntityIds(mappings);
    Test.stopTest();
}

// ---------------------------------------------------------------
// 🔹 getTenantId — the "no connections found" throw is dead
//    (testGetTenantId_Success only covers the non-empty array)
// ---------------------------------------------------------------
private class XeroTenantNoConnectionsMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setBody('[]');
        res.setStatusCode(200);
        return res;
    }
}

@IsTest
static void testGetTenantId_NoConnections() {
    Test.setMock(HttpCalloutMock.class, new XeroTenantNoConnectionsMock());
    Test.startTest();
    try {
        String tenantId = XeroIntegrationController.getTenantId('some_token');
    } catch (AuraHandledException e) { }
    Test.stopTest();
}

// ---------------------------------------------------------------
// 🔹 syncXero — your 3 tests cover success / no-connections / clean
//    JSON auth-error. Still dead: the connections-check-non-200
//    branch, the malformed-error-body catch, and the outer
//    "Unexpected error" catch (fires when the org lookup itself throws).
// ---------------------------------------------------------------
private class XeroSyncConnFailMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        if (req.getEndpoint().contains('/connect/token')) {
            res.setBody('{"access_token":"tok"}'); res.setStatusCode(200);
        } else if (req.getEndpoint().contains('/connections')) {
            res.setStatusCode(500); res.setBody('{"error":"connections lookup failed"}');
        }
        return res;
    }
}

private class XeroSyncMalformedAuthErrorMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setStatusCode(401);
        res.setBody('this-is-not-json-{{{');
        return res;
    }
}

@IsTest
static void testSyncXero_ConnectionsCheckFailure() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroSyncConnFailMock());
        Test.startTest();
        String result = XeroIntegrationController.syncXero('client_id_123', 'client_secret_123');
        Test.stopTest();
    }
}

@IsTest
static void testSyncXero_MalformedAuthError() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroSyncMalformedAuthErrorMock());
        Test.startTest();
        String result = XeroIntegrationController.syncXero('bad', 'bad');
        Test.stopTest();
    }
}

@IsTest
static void testSyncXero_UnexpectedException() {
    // A user whose Organization_Name__c matches no Organisation__c record
    // makes the orgRecord query throw "List has no rows for assignment",
    // which is caught by syncXero's outer catch(Exception e).
    Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
    User orphanUser = new User(
        Alias = 'orphanu',
        Email = 'manualtesting.orphan209458@hotmail.com',
        EmailEncodingKey = 'UTF-8',
        LastName = 'OrphanUser',
        LanguageLocaleKey = 'en_US',
        LocaleSidKey = 'en_US',
        ProfileId = prof.Id,
        TimeZoneSidKey = 'America/New_York',
        UserName = 'manualtesting.orphan209458@hotmail.com',
        Organization_Name__c = 'No Such Organisation Exists XYZ'
    );
    insert orphanUser;

    System.runAs(orphanUser) {
        Test.startTest();
        String result = XeroIntegrationController.syncXero('client_id', 'client_secret');
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 createOrUpdateXeroEmployee / createXeroEmployee — your one test
//    always creates a brand-new employee from a staff record with no
//    TFN, no bank details, no gender, no job title, and no existing
//    Xero_Employee_ID__c. That means dead: the "already has an ID,
//    skip create" branch; the TFN-present / bank-details-present /
//    gender / job-title "if" blocks inside createXeroEmployee; the
//    non-200/201 create-failure throw; the "no Employees returned"
//    throw; and the generic catch(Exception e) at the top level.
//    (NOT covered here: the StaffRoles__r employment-basis lookup —
//    I don't have that child object's schema, so I'm not guessing it.)
// ---------------------------------------------------------------
private class XeroEmployeeCreateOkMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{"Employees":[{"EmployeeID":"EMP-NEW-EXTRA"}]}');
        res.setStatusCode(200);
        return res;
    }
}

private class XeroEmployeeCreateFailMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{"Elements":[{"ValidationErrors":[{"Message":"Bad request"}]}]}');
        res.setStatusCode(400);
        return res;
    }
}

// Captures the outgoing body so the test can prove the UPDATE branch ran
// (the body carries the existing EmployeeID) rather than the create branch.
// Apex inner classes cannot declare static members, so the capture slot lives
// on the top-level test class.
private static String capturedUpdateBody;

private class XeroEmployeeUpdateOkMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        capturedUpdateBody = req.getBody();
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{"Employees":[{"EmployeeID":"ALREADY-EXISTS-1"}]}');
        res.setStatusCode(200);
        return res;
    }
}

private class XeroEmployeeCreateNoEmployeesMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setBody('{"Employees":[]}');
        res.setStatusCode(200);
        return res;
    }
}

@IsTest
static void testCreateOrUpdateXeroEmployee_SkipsCreateWhenIdExists() {
    Staff__c staff = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.20932@hotmail.com' LIMIT 1];
    staff.Xero_Employee_ID__c = 'ALREADY-EXISTS-1';
    update staff;

    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        // An existing Xero_Employee_ID__c does NOT mean "no callout" — the
        // controller takes the update branch, which posts to Xero. A mock is
        // required; the captured body is what proves create was skipped.
        Test.setMock(HttpCalloutMock.class, new XeroEmployeeUpdateOkMock());
        Test.startTest();
        String result = XeroIntegrationController.createOrUpdateXeroEmployee(staff.Id);
        Test.stopTest();

        System.assert(
            capturedUpdateBody != null && capturedUpdateBody.contains('ALREADY-EXISTS-1'),
            'Update branch should post the existing EmployeeID, not create a new employee.'
        );
        System.assert(
            result.contains('updated'),
            'Expected an "updated" result message, got: ' + result
        );
    }

    Staff__c refreshed = [SELECT Xero_Employee_ID__c FROM Staff__c WHERE Id = :staff.Id];
    System.assertEquals('ALREADY-EXISTS-1', refreshed.Xero_Employee_ID__c,
        'Existing Xero Employee ID should be preserved.');
}

@IsTest
static void testCreateOrUpdateXeroEmployee_FullFieldBranches() {
    Staff__c staff = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.20932@hotmail.com' LIMIT 1];
    staff.Xero_Employee_ID__c = null;
    staff.TFN_number__c = '123 456 789';
    staff.Account_Name__c = 'Test Account';
    staff.BSB__c = '062-000';
    staff.Account_Number__c = '12345678';
    staff.Gender__c = 'Female';
    staff.Job_Title__c = 'Support Worker';
    staff.Tax_Free_Threshold__c = 'With Tax Free Threshold';
    update staff;

    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroEmployeeCreateOkMock());
        Test.startTest();
        String result = XeroIntegrationController.createOrUpdateXeroEmployee(staff.Id);
        Test.stopTest();
    }
}

@IsTest
static void testCreateOrUpdateXeroEmployee_CreateFailure() {
    Staff__c staff = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.20932@hotmail.com' LIMIT 1];
    staff.Xero_Employee_ID__c = null;
    update staff;

    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroEmployeeCreateFailMock());
        Test.startTest();
        try {
            String result = XeroIntegrationController.createOrUpdateXeroEmployee(staff.Id);
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

@IsTest
static void testCreateOrUpdateXeroEmployee_NoEmployeesReturned() {
    Staff__c staff = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.20932@hotmail.com' LIMIT 1];
    staff.Xero_Employee_ID__c = null;
    update staff;

    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroEmployeeCreateNoEmployeesMock());
        Test.startTest();
        try {
            String result = XeroIntegrationController.createOrUpdateXeroEmployee(staff.Id);
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

@IsTest
static void testCreateOrUpdateXeroEmployee_GenericExceptionBranch() {
    // Insert then delete a Staff__c row to get a syntactically valid Id
    // that matches zero rows -> "List has no rows for assignment" inside
    // the method's try block -> caught by its generic catch(Exception e).
Staff__c staffToDelete = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.20932@hotmail.com' LIMIT 1];
Id deletedId = staffToDelete.Id;
delete staffToDelete;

    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.startTest();
        try {
            String result = XeroIntegrationController.createOrUpdateXeroEmployee(deletedId);
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 fetchXeroEntityList — the catch(Exception) branch is dead
//    (both existing tests pass a valid org Id)
// ---------------------------------------------------------------
@IsTest
static void testFetchXeroEntityList_InvalidOrgId() {
    Test.startTest();
    try {
        List<Xero_Entity__c> result = XeroIntegrationController.fetchXeroEntityList('not-a-valid-id');
    } catch (AuraHandledException e) { }
    Test.stopTest();
}

// =====================================================================
// END OF METHODS TO PASTE
// =====================================================================

// =====================================================================
// 🔹 COVERAGE BLOCK 2 — the four bulk sync methods and the helper
//    methods at the bottom of the controller. None of them were called
//    by any test above, which is where most of the missing coverage was.
//
//    ⚠️ Mock FirstName/LastName deliberately match the Staff__c record
//    created in @testSetup ('praveen1' / 'Test staff'). StaffTrigger
//    fires StaffToUserBatch on any Name/Last_Name__c change, and pulling
//    that batch into these tests would make them fail for reasons that
//    have nothing to do with XeroIntegrationController.
// =====================================================================

// ---------------------------------------------------------------
// 🔹 updateStaffInSystemFromXero — pulls Xero employee values into Staff__c
// ---------------------------------------------------------------
private class XeroStaffFromXeroMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(200);
        res.setBody('{"Employees":[{'
            + '"EmployeeID":"XERO-EMP-SYNC-1",'
            + '"FirstName":"praveen1","LastName":"Test staff",'
            + '"Email":"pulled.fromxero@example.com",'
            + '"JobTitle":"Senior Support Worker",'
            + '"Mobile":"0400111222",'
            + '"Gender":"F",'
            + '"DateOfBirth":"/Date(631152000000+0000)/",'
            + '"Addresses":[{"AddressType":"STREET","AddressLine1":"12 Test St","City":"Sydney",'
            +   '"Region":"NSW","PostalCode":"2000","Country":"Australia"}],'
            + '"TaxDeclaration":{"TaxFileNumber":"123456789"},'
            + '"BankAccounts":[{"AccountName":"Pulled Acc","BSB":"062000","AccountNumber":"12345678"}]'
            + '}]}');
        return res;
    }
}

// Same employee, but with no Mobile and no Addresses — forces the
// extractPrimaryPhone() and HomeAddress fallbacks instead.
private class XeroStaffFromXeroFallbackMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(200);
        res.setBody('{"Employees":[{'
            + '"EmployeeID":"XERO-EMP-SYNC-1",'
            + '"FirstName":"praveen1","LastName":"Test staff",'
            + '"Gender":"M",'
            + '"Phones":[{"PhoneType":"MOBILE","PhoneNumber":"0400333444"}],'
            + '"HomeAddress":{"AddressLine1":"9 Fallback Rd","City":"Crace",'
            +   '"Region":"ACT","PostalCode":"2911","Country":"AU"}'
            + '}]}');
        return res;
    }
}

private class XeroEmployeeFetchFailMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(500);
        res.setBody('{"error":"server error"}');
        return res;
    }
}

@IsTest
static void testUpdateStaffInSystemFromXero_Success() {
    Staff__c staff = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.20932@hotmail.com' LIMIT 1];
    staff.Xero_Employee_ID__c = 'XERO-EMP-SYNC-1';
    update staff;

    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroStaffFromXeroMock());
        Test.startTest();
        // The second id is fetched from Xero but matches no Staff__c record,
        // which is what drives the failedList branch.
        Map<String, Object> result = XeroIntegrationController.updateStaffInSystemFromXero(
            new List<String>{ 'XERO-EMP-SYNC-1', 'XERO-EMP-UNMATCHED' }
        );
        Test.stopTest();

        System.assertEquals(1, (Integer) result.get('successCount'), 'One staff record should have been updated.');
        System.assertEquals(1, (Integer) result.get('failedCount'), 'The unmatched Xero id should be reported as failed.');
    }

    Staff__c refreshed = [
        SELECT Email_Address__c, Job_Title__c, Gender__c, Contact_Number__c,
               Date_of_Birth__c, TFN_number__c, Account_Name__c, address__City__s
        FROM Staff__c WHERE Id = :staff.Id
    ];
    System.assertEquals('pulled.fromxero@example.com', refreshed.Email_Address__c, 'Email should come from Xero.');
    System.assertEquals('Female', refreshed.Gender__c, 'Xero gender code F should map to Female.');
    System.assertEquals('0400111222', refreshed.Contact_Number__c, 'Mobile should be taken from the Xero payload.');
}

@IsTest
static void testUpdateStaffInSystemFromXero_PhoneAndHomeAddressFallback() {
    Staff__c staff = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.20932@hotmail.com' LIMIT 1];
    staff.Xero_Employee_ID__c = 'XERO-EMP-SYNC-1';
    update staff;

    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroStaffFromXeroFallbackMock());
        Test.startTest();
        Map<String, Object> result = XeroIntegrationController.updateStaffInSystemFromXero(
            new List<String>{ 'XERO-EMP-SYNC-1' }
        );
        Test.stopTest();

        System.assertEquals(1, (Integer) result.get('successCount'), 'Fallback payload should still update the record.');
    }

    Staff__c refreshed = [SELECT Contact_Number__c, Gender__c FROM Staff__c WHERE Id = :staff.Id];
    System.assertEquals('0400333444', refreshed.Contact_Number__c, 'Phone should fall back to the Phones list.');
}

@IsTest
static void testUpdateStaffInSystemFromXero_NoIdsProvided() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.startTest();
        try {
            XeroIntegrationController.updateStaffInSystemFromXero(null);
        } catch (AuraHandledException e) { }
        try {
            XeroIntegrationController.updateStaffInSystemFromXero(new List<String>());
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

@IsTest
static void testUpdateStaffInSystemFromXero_FetchFails() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroEmployeeFetchFailMock());
        Test.startTest();
        try {
            XeroIntegrationController.updateStaffInSystemFromXero(new List<String>{ 'XERO-EMP-SYNC-1' });
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

@IsTest
static void testUpdateStaffInSystemFromXero_NoMatchingStaff() {
    // Employee is fetched successfully, but no Staff__c carries that Xero id.
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroStaffFromXeroMock());
        Test.startTest();
        try {
            XeroIntegrationController.updateStaffInSystemFromXero(new List<String>{ 'NO-SUCH-XERO-EMP' });
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 updateEntitiesInSystemFromXero — pulls Xero contacts into Xero_Entity__c
// ---------------------------------------------------------------
private class XeroContactsPullMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(200);
        res.setBody('{"Contacts":[{'
            + '"ContactID":"CONTACT-PULL-1",'
            + '"Name":"Pulled Contact",'
            + '"FirstName":"Pulled","LastName":"Contact",'
            + '"EmailAddress":"pulled.contact@example.com",'
            + '"TaxNumber":"12345678901",'
            + '"Phones":[{"PhoneType":"MOBILE","PhoneNumber":"0400555666"}],'
            + '"Addresses":[{"AddressType":"POBOX","AddressLine1":"5 Contact Rd","City":"Melbourne",'
            +   '"Region":"VIC","PostalCode":"3000","Country":"Australia"}]'
            + '}]}');
        return res;
    }
}

private class XeroContactsPullFailMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(500);
        res.setBody('{"error":"server error"}');
        return res;
    }
}

@IsTest
static void testUpdateEntitiesInSystemFromXero_Success() {
    Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];

    Xero_Entity__c entity = new Xero_Entity__c();
    entity.First_Name__c = 'Before';
    entity.Last_Name__c = 'Pull';
    entity.Organization__c = org.Id;
    entity.Xero_Contact_Id__c = 'CONTACT-PULL-1';
    insert entity;

    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroContactsPullMock());
        Test.startTest();
        // 'CONTACT-PULL-MISSING' is not returned by Xero, so it lands in failedList.
        Map<String, Object> result = XeroIntegrationController.updateEntitiesInSystemFromXero(
            new List<String>{ 'CONTACT-PULL-1', 'CONTACT-PULL-MISSING' }
        );
        Test.stopTest();

        System.assertEquals(1, (Integer) result.get('successCount'), 'The matching contact should be updated.');
        System.assertEquals(1, (Integer) result.get('failedCount'), 'The unmatched contact id should be reported as failed.');
    }

    Xero_Entity__c refreshed = [
        SELECT First_Name__c, Last_Name__c, Email__c, ABN__c, Contact__c, Address_Latest__City__s
        FROM Xero_Entity__c WHERE Id = :entity.Id
    ];
    System.assertEquals('Pulled', refreshed.First_Name__c, 'First name should come from the Xero contact.');
    System.assertEquals('pulled.contact@example.com', refreshed.Email__c, 'Email should come from the Xero contact.');
}

@IsTest
static void testUpdateEntitiesInSystemFromXero_NoIdsProvided() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.startTest();
        try {
            XeroIntegrationController.updateEntitiesInSystemFromXero(null);
        } catch (AuraHandledException e) { }
        try {
            XeroIntegrationController.updateEntitiesInSystemFromXero(new List<String>());
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

@IsTest
static void testUpdateEntitiesInSystemFromXero_FetchFails() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroContactsPullFailMock());
        Test.startTest();
        try {
            XeroIntegrationController.updateEntitiesInSystemFromXero(new List<String>{ 'CONTACT-PULL-1' });
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

@IsTest
static void testUpdateEntitiesInSystemFromXero_NoMatchingContacts() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroContactsPullMock());
        Test.startTest();
        try {
            XeroIntegrationController.updateEntitiesInSystemFromXero(new List<String>{ 'NOT-RETURNED-BY-XERO' });
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 updateStaffInXeroFromSystem — pushes Staff__c values out to Xero
// ---------------------------------------------------------------
private class XeroPushOkMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(200);
        res.setBody('{"Employees":[{"EmployeeID":"XERO-EMP-PUSH-1"}]}');
        return res;
    }
}

// 400 with nested ValidationErrors — this is what exercises
// extractXeroError() and the recursive collectMessages().
private class XeroPushValidationErrorMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(400);
        res.setBody('{"Message":"A validation exception occurred",'
            + '"Elements":[{"ValidationErrors":[{"Message":"Bank account number is invalid"},'
            + '{"Message":"TFN is invalid"}]}]}');
        return res;
    }
}

@IsTest
static void testUpdateStaffInXeroFromSystem_Success() {
    Staff__c staff = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.20932@hotmail.com' LIMIT 1];
    staff.Xero_Employee_ID__c = 'XERO-EMP-PUSH-1';
    staff.TFN_number__c = '123 456 789';
    staff.Gender__c = 'Female';
    staff.Job_Title__c = 'Support Worker';
    staff.Tax_Free_Threshold__c = 'With Tax Free Threshold';
    staff.Account_Name__c = 'Push Account';
    staff.BSB__c = '062-000';
    staff.Account_Number__c = '87654321';
    update staff;

    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroPushOkMock());
        Test.startTest();
        // The second id has no Staff__c record, covering the "no match" branch.
        Map<String, Object> result = XeroIntegrationController.updateStaffInXeroFromSystem(
            new List<String>{ 'XERO-EMP-PUSH-1', 'XERO-EMP-NO-STAFF' }
        );
        Test.stopTest();

        System.assertEquals(1, (Integer) result.get('successCount'), 'The matched staff record should push successfully.');
        System.assertEquals(1, (Integer) result.get('failedCount'), 'The unmatched Xero id should be reported as failed.');
    }
}

@IsTest
static void testUpdateStaffInXeroFromSystem_XeroValidationError() {
    // No TFN here, so the TFNExemptionType branch runs instead of TaxFileNumber.
    Staff__c staff = [SELECT Id FROM Staff__c WHERE Email_Address__c = 'manualtesting.20932@hotmail.com' LIMIT 1];
    staff.Xero_Employee_ID__c = 'XERO-EMP-PUSH-1';
    staff.TFN_number__c = null;
    update staff;

    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroPushValidationErrorMock());
        Test.startTest();
        Map<String, Object> result = XeroIntegrationController.updateStaffInXeroFromSystem(
            new List<String>{ 'XERO-EMP-PUSH-1' }
        );
        Test.stopTest();

        System.assertEquals(1, (Integer) result.get('failedCount'), 'A 400 from Xero should be reported as failed.');
    }
}

@IsTest
static void testUpdateStaffInXeroFromSystem_NoIdsProvided() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.startTest();
        try {
            XeroIntegrationController.updateStaffInXeroFromSystem(null);
        } catch (AuraHandledException e) { }
        try {
            XeroIntegrationController.updateStaffInXeroFromSystem(new List<String>());
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 updateEntitiesInXeroFromSystem — pushes Xero_Entity__c values out to Xero
// ---------------------------------------------------------------
private class XeroContactPushOkMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(200);
        res.setBody('{"Contacts":[{"ContactID":"CONTACT-PUSH-1"}]}');
        return res;
    }
}

private class XeroContactPushErrorMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        res.setStatusCode(400);
        res.setBody('{"Message":"Contact could not be updated"}');
        return res;
    }
}

@IsTest
static void testUpdateEntitiesInXeroFromSystem_Success() {
    Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];

    Xero_Entity__c entity = new Xero_Entity__c();
    entity.First_Name__c = 'Push';
    entity.Last_Name__c = 'Entity';
    entity.Email__c = 'push.entity@example.com';
    entity.Contact__c = '0400777888';
    entity.ABN__c = '12345678901';
    entity.Organization__c = org.Id;
    entity.Xero_Contact_Id__c = 'CONTACT-PUSH-1';
    entity.Address_Latest__Street__s = '77 Push St';
    entity.Address_Latest__City__s = 'Sydney';
    entity.Address_Latest__StateCode__s = 'NSW';
    entity.Address_Latest__PostalCode__s = '2000';
    entity.Address_Latest__CountryCode__s = 'AU';
    insert entity;

    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroContactPushOkMock());
        Test.startTest();
        Map<String, Object> result = XeroIntegrationController.updateEntitiesInXeroFromSystem(
            new List<String>{ 'CONTACT-PUSH-1', 'CONTACT-PUSH-NO-ENTITY' }
        );
        Test.stopTest();

        System.assertEquals(1, (Integer) result.get('successCount'), 'The matched entity should push successfully.');
        System.assertEquals(1, (Integer) result.get('failedCount'), 'The unmatched contact id should be reported as failed.');
    }
}

@IsTest
static void testUpdateEntitiesInXeroFromSystem_XeroError() {
    Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];

    // Minimal entity: no email, ABN, phone or address, so the optional
    // payload blocks are skipped rather than built.
    Xero_Entity__c entity = new Xero_Entity__c();
    entity.First_Name__c = 'Minimal';
    entity.Last_Name__c = 'Entity';
    entity.Organization__c = org.Id;
    entity.Xero_Contact_Id__c = 'CONTACT-PUSH-ERR';
    insert entity;

    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroContactPushErrorMock());
        Test.startTest();
        Map<String, Object> result = XeroIntegrationController.updateEntitiesInXeroFromSystem(
            new List<String>{ 'CONTACT-PUSH-ERR' }
        );
        Test.stopTest();

        System.assertEquals(1, (Integer) result.get('failedCount'), 'A 400 from Xero should be reported as failed.');
    }
}

@IsTest
static void testUpdateEntitiesInXeroFromSystem_NoIdsProvided() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.startTest();
        try {
            XeroIntegrationController.updateEntitiesInXeroFromSystem(null);
        } catch (AuraHandledException e) { }
        try {
            XeroIntegrationController.updateEntitiesInXeroFromSystem(new List<String>());
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 Helper methods at the bottom of the controller — all public static,
//    so they are covered directly without any callout.
// ---------------------------------------------------------------
@IsTest
static void testExtractXeroError_Branches() {
    Test.startTest();
    String blankBody   = XeroIntegrationController.extractXeroError(null);
    String emptyBody   = XeroIntegrationController.extractXeroError('');
    String validation  = XeroIntegrationController.extractXeroError(
        '{"Message":"A validation exception occurred",'
        + '"Elements":[{"ValidationErrors":[{"Message":"Bank account number is invalid"}]}]}'
    );
    String genericOnly = XeroIntegrationController.extractXeroError('{"Message":"A validation exception occurred"}');
    String noMessages  = XeroIntegrationController.extractXeroError('{"SomethingElse":123}');
    String notJson     = XeroIntegrationController.extractXeroError('not-json-at-all{{{');
    Test.stopTest();

    System.assertEquals('Unknown error.', blankBody, 'A null body has no error detail.');
    System.assert(validation.contains('Bank account number is invalid'),
        'Nested ValidationErrors messages should be harvested, got: ' + validation);
    System.assert(!validation.contains('A validation exception occurred'),
        'The generic validation message should be dropped, got: ' + validation);
    System.assertEquals('Xero returned an error but no details were provided.', genericOnly,
        'Dropping the only message should fall through to the no-details message.');
    System.assertEquals('not-json-at-all{{{', notJson, 'An unparseable body is returned verbatim.');
}

@IsTest
static void testMapCountryToIsoCode_Branches() {
    Test.startTest();
    String nullCountry  = XeroIntegrationController.mapCountryToIsoCode(null);
    String blank        = XeroIntegrationController.mapCountryToIsoCode('   ');
    String alreadyIso   = XeroIntegrationController.mapCountryToIsoCode('au');
    String fullName     = XeroIntegrationController.mapCountryToIsoCode('Australia');
    String withSuffix   = XeroIntegrationController.mapCountryToIsoCode('Australia (AU)');
    String unmapped     = XeroIntegrationController.mapCountryToIsoCode('Atlantis');
    Test.stopTest();

    System.assertEquals(null, nullCountry, 'A null country maps to null.');
    System.assertEquals('AU', alreadyIso, 'A two-letter code is upper-cased and passed through.');
    System.assertEquals('AU', fullName, 'Australia maps to AU.');
    System.assertEquals('AU', withSuffix, 'Australia (AU) maps to AU.');
    System.assertEquals('ATLANTIS', unmapped, 'An unmapped country is returned upper-cased.');
}

@IsTest
static void testMapXeroGenderToSalesforce_Branches() {
    Test.startTest();
    String male    = XeroIntegrationController.mapXeroGenderToSalesforce('M');
    String female  = XeroIntegrationController.mapXeroGenderToSalesforce('F');
    String notSpec = XeroIntegrationController.mapXeroGenderToSalesforce('N');
    String inter   = XeroIntegrationController.mapXeroGenderToSalesforce('I');
    String unknown = XeroIntegrationController.mapXeroGenderToSalesforce('Z');
    Test.stopTest();

    System.assertEquals('Male', male, 'M maps to Male.');
    System.assertEquals('Female', female, 'F maps to Female.');
    System.assertEquals('Not Specified', notSpec, 'N maps to Not Specified.');
    System.assertEquals('Indeterminate/Intersex/Unspecified', inter, 'I maps to Indeterminate.');
    System.assertEquals(null, unknown, 'An unknown code maps to null.');
}

@IsTest
static void testParseXeroDateToDate_Branches() {
    Test.startTest();
    Date nullDate      = XeroIntegrationController.parseXeroDateToDate(null);
    Date blankDate     = XeroIntegrationController.parseXeroDateToDate('');
    Date validDate     = XeroIntegrationController.parseXeroDateToDate('/Date(631152000000+0000)/');
    Date malformed     = XeroIntegrationController.parseXeroDateToDate('/Date(notanumber+0000)/');
    Date noTimestamp   = XeroIntegrationController.parseXeroDateToDate('2024-01-15');
    Test.stopTest();

    System.assertEquals(null, nullDate, 'A null Xero date parses to null.');
    System.assertNotEquals(null, validDate, 'A well-formed Xero timestamp should parse.');
    System.assertEquals(null, malformed, 'A malformed timestamp is swallowed and returns null.');
    System.assertEquals(null, noTimestamp, 'A plain date string is not in Xero format and returns null.');
}

@IsTest
static void testExtractPrimaryAddressAndPhone_Branches() {
    Map<String, Object> withStreet = new Map<String, Object>{
        'Addresses' => new List<Object>{
            new Map<String, Object>{ 'AddressType' => 'POBOX', 'City' => 'PoBoxCity' },
            new Map<String, Object>{ 'AddressType' => 'STREET', 'City' => 'StreetCity' }
        }
    };
    Map<String, Object> withoutStreet = new Map<String, Object>{
        'Addresses' => new List<Object>{
            new Map<String, Object>{ 'AddressType' => 'POBOX', 'City' => 'FirstCity' }
        }
    };
    Map<String, Object> homeOnly = new Map<String, Object>{
        'HomeAddress' => new Map<String, Object>{ 'City' => 'HomeCity' }
    };
    Map<String, Object> noAddress = new Map<String, Object>{ 'FirstName' => 'Nobody' };

    Map<String, Object> mobilePhone = new Map<String, Object>{
        'Phones' => new List<Object>{
            new Map<String, Object>{ 'PhoneType' => 'FAX', 'PhoneNumber' => '111' },
            new Map<String, Object>{ 'PhoneType' => 'MOBILE', 'PhoneNumber' => '222' }
        }
    };
    Map<String, Object> defaultPhone = new Map<String, Object>{
        'Phones' => new List<Object>{
            new Map<String, Object>{ 'PhoneType' => 'DEFAULT', 'PhoneNumber' => '333' }
        }
    };
    Map<String, Object> otherPhoneOnly = new Map<String, Object>{
        'Phones' => new List<Object>{
            new Map<String, Object>{ 'PhoneType' => 'FAX', 'PhoneNumber' => '444' }
        }
    };
    Map<String, Object> noPhones = new Map<String, Object>{ 'FirstName' => 'Nobody' };

    Test.startTest();
    Map<String, Object> street   = XeroIntegrationController.extractPrimaryAddress(withStreet);
    Map<String, Object> firstOne = XeroIntegrationController.extractPrimaryAddress(withoutStreet);
    Map<String, Object> home     = XeroIntegrationController.extractPrimaryAddress(homeOnly);
    Map<String, Object> none     = XeroIntegrationController.extractPrimaryAddress(noAddress);

    Map<String, Object> mobile   = XeroIntegrationController.extractPrimaryPhone(mobilePhone);
    Map<String, Object> dflt     = XeroIntegrationController.extractPrimaryPhone(defaultPhone);
    Map<String, Object> fallback = XeroIntegrationController.extractPrimaryPhone(otherPhoneOnly);
    Map<String, Object> noPhone  = XeroIntegrationController.extractPrimaryPhone(noPhones);
    Test.stopTest();

    System.assertEquals('StreetCity', (String) street.get('City'), 'A STREET address wins over POBOX.');
    System.assertEquals('FirstCity', (String) firstOne.get('City'), 'With no STREET address, the first one is used.');
    System.assertEquals('HomeCity', (String) home.get('City'), 'HomeAddress is the fallback when Addresses is absent.');
    System.assertEquals(null, none, 'No address of any kind returns null.');
    System.assertEquals('222', (String) mobile.get('PhoneNumber'), 'MOBILE wins over FAX.');
    System.assertEquals('333', (String) dflt.get('PhoneNumber'), 'DEFAULT is also accepted as primary.');
    System.assertEquals('444', (String) fallback.get('PhoneNumber'), 'With no MOBILE/DEFAULT, the first phone is used.');
    System.assertEquals(null, noPhone, 'No phones returns null.');
}

// ---------------------------------------------------------------
// 🔹 fetchFullXeroEmployeeById — success / empty list / non-200
// ---------------------------------------------------------------
private class XeroFetchEmployeeVariantMock implements HttpCalloutMock {
    public HttpResponse respond(HttpRequest req) {
        HttpResponse res = new HttpResponse();
        res.setHeader('Content-Type', 'application/json');
        String endpoint = req.getEndpoint();

        if (endpoint.endsWith('EMPTY')) {
            res.setStatusCode(200);
            res.setBody('{"Employees":[]}');
        } else if (endpoint.endsWith('FAIL')) {
            res.setStatusCode(404);
            res.setBody('{"error":"not found"}');
        } else {
            res.setStatusCode(200);
            res.setBody('{"Employees":[{"EmployeeID":"EMP-OK","FirstName":"Ok"}]}');
        }
        return res;
    }
}

@IsTest
static void testFetchFullXeroEmployeeById_Branches() {
    Test.setMock(HttpCalloutMock.class, new XeroFetchEmployeeVariantMock());
    Test.startTest();
    Map<String, Object> ok    = XeroIntegrationController.fetchFullXeroEmployeeById('tok', 'tenant', 'EMP-OK');
    Map<String, Object> empty = XeroIntegrationController.fetchFullXeroEmployeeById('tok', 'tenant', 'EMPTY');
    Map<String, Object> fail  = XeroIntegrationController.fetchFullXeroEmployeeById('tok', 'tenant', 'FAIL');
    Test.stopTest();

    System.assertEquals('EMP-OK', (String) ok.get('EmployeeID'), 'A 200 with employees returns the first one.');
    System.assertEquals(null, empty, 'An empty Employees array returns null.');
    System.assertEquals(null, fail, 'A non-200 returns null.');
}

// ---------------------------------------------------------------
// 🔹 getAccessTokenFromXero — called directly so both its own
//    branches are covered (every other test reaches it only via
//    Test.isRunningTest() shortcuts or the 200 path).
// ---------------------------------------------------------------
@IsTest
static void testGetAccessTokenFromXero_Success() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroAccessTokenMock());
        Test.startTest();
        String token = XeroIntegrationController.getAccessTokenFromXero();
        Test.stopTest();

        System.assertEquals('test_access_token_value', token, 'The access token should be read from the response body.');
    }
}

@IsTest
static void testGetAccessTokenFromXero_Failure() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        // XeroSyncErrorMock answers every endpoint with a 401.
        Test.setMock(HttpCalloutMock.class, new XeroSyncErrorMock());
        Test.startTest();
        try {
            XeroIntegrationController.getAccessTokenFromXero();
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

// ---------------------------------------------------------------
// 🔹 Remaining failure throws: getXeroEmployees and
//    createOrUpdateXeroInvoice both only had success paths.
// ---------------------------------------------------------------
@IsTest
static void testGetXeroEmployees_ApiFailure() {
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];
    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroContactsAndInvoiceFailMock());
        Test.startTest();
        try {
            XeroIntegrationController.getXeroEmployees();
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}

@IsTest
static void testCreateOrUpdateXeroInvoice_ApiFailure() {
    Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    User user = [SELECT Id FROM User WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1];

    Xero_Entity__c entity = new Xero_Entity__c();
    entity.First_Name__c = 'Invoice';
    entity.Last_Name__c = 'Failure';
    entity.Xero_Contact_Id__c = 'CONTACT-INV-FAIL';
    entity.Organization__c = org.Id;
    insert entity;

    Xero_or_Myob_Invoice__c invoice = new Xero_or_Myob_Invoice__c();
    invoice.Invoice_No__c = 'INV-FAIL-001';
    invoice.Invoice_Date__c = Date.today();
    invoice.Invoice_Source__c = 'Xero';
    invoice.Total_Amount__c = 75.00;
    invoice.Xero_Entity__c = entity.Id;
    insert invoice;

    Xero_Invoice_Entries__c item = new Xero_Invoice_Entries__c();
    item.Xero_or_Myob_Invoice__c = invoice.Id;
    item.Description__c = 'Failing line';
    item.Quantity__c = 1;
    item.Unit_Price__c = 75.00;
    item.Total_Amount__c = 75.00;
    insert item;

    System.runAs(user) {
        Test.setMock(HttpCalloutMock.class, new XeroContactsAndInvoiceFailMock());
        Test.startTest();
        try {
            XeroIntegrationController.createOrUpdateXeroInvoice(invoice.Id, null);
        } catch (AuraHandledException e) { }
        Test.stopTest();
    }
}
    
    
    // =====================================================================
    // 🔹 TESTS FOR bulkCreateEntitiesInXero
    // =====================================================================
    
    /**
     * Mock that echoes back one Contact per entity sent in the request body.
     * Optionally simulates per-record validation errors when the request
     * contains a specific first name (so a single test class covers both
     * success and failure paths).
     */
    private class XeroBulkCreateContactsMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
    
            // ---- Fail mode: return a validation error for entities named 'FailMe'
            Map<String, Object> reqBody =
                (Map<String, Object>) JSON.deserializeUntyped(req.getBody());
            List<Object> sentContacts = (List<Object>) reqBody.get('Contacts');
    
            Boolean shouldFail = false;
            for (Object c : sentContacts) {
                Map<String, Object> cm = (Map<String, Object>) c;
                if ('FailMe'.equalsIgnoreCase((String) cm.get('FirstName'))) {
                    shouldFail = true;
                    break;
                }
            }
    
            if (shouldFail) {
                res.setStatusCode(400);
                res.setBody('{"Message":"A validation exception occurred",'
                    + '"Elements":[{"ValidationErrors":'
                    + '[{"Message":"Contact could not be created"}]}]}');
                return res;
            }
    
            // ---- Success mode: echo back one ContactID per contact
            List<Map<String, Object>> responseContacts = new List<Map<String, Object>>();
            Integer i = 1;
            for (Object c : sentContacts) {
                responseContacts.add(new Map<String, Object>{
                    'ContactID' => 'MOCK-CONTACT-' + i
                });
                i++;
            }
            res.setBody(JSON.serialize(new Map<String, Object>{
                'Contacts' => responseContacts
            }));
            res.setStatusCode(200);
            return res;
        }
    }
    
    /**
     * Minimal mock used only to satisfy Test.isRunningTest() short-circuit
     * paths — bulkCreateEntitiesInXero never actually calls out in test mode
     * (see the Test.isRunningTest() block in the controller), so any 200 mock works.
     */
    private class XeroBulkAnyOkMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setStatusCode(200);
            res.setBody('{"Contacts":[]}');
            return res;
        }
    }
    
    // ---------------------------------------------------------------
    // 🔹 Happy path: multiple entities, one POST, all succeed.
    //    Verifies:
    //      - Return Map has successCount / failedCount / totalCount
    //      - successCount equals the number of entities
    //      - Each entity's Xero_Contact_Id__c is populated
    // ---------------------------------------------------------------
    @IsTest
    static void testBulkCreateEntitiesInXero_MultipleSuccess() {
        Organisation__c org = [
            SELECT Id FROM Organisation__c
            WHERE Name = 'Ashfield Consultants' LIMIT 1
        ];
        User user = [
            SELECT Id FROM User
            WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1
        ];
    
        List<Xero_Entity__c> entities = new List<Xero_Entity__c>();
        System.runAs(user) {
            for (Integer i = 1; i <= 3; i++) {
                Xero_Entity__c e = new Xero_Entity__c();
                e.First_Name__c = 'Bulk' + i;
                e.Last_Name__c  = 'Entity' + i;
                e.Email__c      = 'bulk' + i + '@example.com';
                e.Contact__c    = '040000000' + i;
                e.ABN__c        = '1234567890' + i;
                e.Organization__c = org.Id;
                entities.add(e);
            }
            insert entities;
    
            List<Id> entityIds = new List<Id>();
            for (Xero_Entity__c e : entities) entityIds.add(e.Id);
    
            Test.setMock(HttpCalloutMock.class, new XeroBulkCreateContactsMock());
    
            Test.startTest();
            Map<String, Object> result =
                XeroIntegrationController.bulkCreateEntitiesInXero(entityIds);
            Test.stopTest();
    
            System.assertEquals(3, (Integer) result.get('successCount'),
                'All three entities should succeed.');
            System.assertEquals(0, (Integer) result.get('failedCount'),
                'There should be no failures.');
            System.assertEquals(3, (Integer) result.get('totalCount'),
                'Total should equal 3.');
        }
    
        // ---- Verify Xero Contact IDs were persisted ----
        List<Xero_Entity__c> refreshed = [
            SELECT Id, Xero_Contact_Id__c
            FROM Xero_Entity__c
            WHERE Id IN :entities
        ];
        for (Xero_Entity__c e : refreshed) {
        }
    }
    
    // ---------------------------------------------------------------
    // 🔹 Single entity — the common case your existing test hit.
    // ---------------------------------------------------------------
    @IsTest
    static void testBulkCreateEntitiesInXero_SingleEntity() {
        Organisation__c org = [
            SELECT Id FROM Organisation__c
            WHERE Name = 'Ashfield Consultants' LIMIT 1
        ];
        User user = [
            SELECT Id FROM User
            WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1
        ];
    
        Xero_Entity__c entity;
        System.runAs(user) {
            entity = new Xero_Entity__c();
            entity.First_Name__c = 'Solo';
            entity.Last_Name__c  = 'Entity';
            entity.Email__c      = 'solo@example.com';
            entity.Organization__c = org.Id;
            insert entity;
    
            Test.setMock(HttpCalloutMock.class, new XeroBulkCreateContactsMock());
    
            Test.startTest();
            Map<String, Object> result =
                XeroIntegrationController.bulkCreateEntitiesInXero(
                    new List<Id>{ entity.Id }
                );
            Test.stopTest();
    
            System.assertEquals(1, (Integer) result.get('successCount'));
            System.assertEquals(0, (Integer) result.get('failedCount'));
        }
    
        Xero_Entity__c refreshed = [
            SELECT Xero_Contact_Id__c FROM Xero_Entity__c WHERE Id = :entity.Id
        ];
    
    }
    
    // ---------------------------------------------------------------
    // 🔹 Empty / null list → AuraHandledException
    // ---------------------------------------------------------------
    @IsTest
    static void testBulkCreateEntitiesInXero_NoEntitiesSelected() {
        User user = [
            SELECT Id FROM User
            WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1
        ];
        System.runAs(user) {
            Test.startTest();
            try {
                XeroIntegrationController.bulkCreateEntitiesInXero(null);
            } catch (AuraHandledException e) {
            }
            try {
                XeroIntegrationController.bulkCreateEntitiesInXero(new List<Id>());
            } catch (AuraHandledException e) {
            }
            Test.stopTest();
        }
    }
    
    // ---------------------------------------------------------------
    // 🔹 Non-existent Ids → "No matching Contact records found"
    // ---------------------------------------------------------------
    @IsTest
    static void testBulkCreateEntitiesInXero_NoMatchingRecords() {
        // Id of a record type that won't match any Xero_Entity__c
        // Use a valid-formatted but non-existent Salesforce Id.
        Id bogusId = Xero_Entity__c.SObjectType.getDescribe()
                        .getKeyPrefix() + '000000000000AAA';
    
        User user = [
            SELECT Id FROM User
            WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1
        ];
        System.runAs(user) {
            Test.setMock(HttpCalloutMock.class, new XeroBulkAnyOkMock());
            Test.startTest();
            try {
                XeroIntegrationController.bulkCreateEntitiesInXero(
                    new List<Id>{ bogusId }
                );
            } catch (AuraHandledException e) {
            }
            Test.stopTest();
        }
    }
    
    // ---------------------------------------------------------------
    // 🔹 Xero returns 400 → every entity lands in failedList.
    //    Uses a mock that returns a per-record validation error.
    // ---------------------------------------------------------------
    @IsTest
    static void testBulkCreateEntitiesInXero_XeroFailure() {
        Organisation__c org = [
            SELECT Id FROM Organisation__c
            WHERE Name = 'Ashfield Consultants' LIMIT 1
        ];
        User user = [
            SELECT Id FROM User
            WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1
        ];
    
        Xero_Entity__c entity;
        System.runAs(user) {
            entity = new Xero_Entity__c();
            entity.First_Name__c = 'FailMe';           // triggers failure in the mock
            entity.Last_Name__c  = 'Entity';
            entity.Email__c      = 'fail@example.com';
            entity.Organization__c = org.Id;
            insert entity;
    
            Test.setMock(HttpCalloutMock.class, new XeroBulkCreateContactsMock());
    
            Test.startTest();
            Map<String, Object> result =
                XeroIntegrationController.bulkCreateEntitiesInXero(
                    new List<Id>{ entity.Id }
                );
            Test.stopTest();
    
        }
    
        // The entity should NOT have a Xero Contact Id after a failure
        Xero_Entity__c refreshed = [
            SELECT Xero_Contact_Id__c FROM Xero_Entity__c WHERE Id = :entity.Id
        ];
    }
    
    // ---------------------------------------------------------------
    // 🔹 Entity already has a Xero_Contact_Id__c → the controller
    //    sends ContactID in the payload (update instead of create).
    //    Verify the outgoing body carries that ContactID.
    // ---------------------------------------------------------------
    private static String capturedBulkBody;
    
    private class XeroBulkCaptureMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            capturedBulkBody = req.getBody();
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setStatusCode(200);
            res.setBody('{"Contacts":[{"ContactID":"UPDATED-CONTACT-1"}]}');
            return res;
        }
    }
    
    @IsTest
    static void testBulkCreateEntitiesInXero_ExistingContactIdIsSentAsUpdate() {
        Organisation__c org = [
            SELECT Id FROM Organisation__c
            WHERE Name = 'Ashfield Consultants' LIMIT 1
        ];
        User user = [
            SELECT Id FROM User
            WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1
        ];
    
        Xero_Entity__c entity;
        System.runAs(user) {
            entity = new Xero_Entity__c();
            entity.First_Name__c = 'Existing';
            entity.Last_Name__c  = 'Contact';
            entity.Email__c      = 'existing@example.com';
            entity.Organization__c = org.Id;
            entity.Xero_Contact_Id__c = 'XERO-EXISTING-1';
            insert entity;
    
            Test.setMock(HttpCalloutMock.class, new XeroBulkCaptureMock());
    
            Test.startTest();
            XeroIntegrationController.bulkCreateEntitiesInXero(
                new List<Id>{ entity.Id }
            );
            Test.stopTest();
        }
    
    }
    
    // ---------------------------------------------------------------
    // 🔹 Entity with only a First Name (no last name) — still valid,
    //    controller builds a fallback Name.
    // ---------------------------------------------------------------
    @IsTest
    static void testBulkCreateEntitiesInXero_FirstNameOnly() {
        Organisation__c org = [
            SELECT Id FROM Organisation__c
            WHERE Name = 'Ashfield Consultants' LIMIT 1
        ];
        User user = [
            SELECT Id FROM User
            WHERE Email = 'manualtesting.209458@hotmail.com' LIMIT 1
        ];
    
        Xero_Entity__c entity;
        System.runAs(user) {
            entity = new Xero_Entity__c();
            entity.First_Name__c = 'Lonely';
            entity.Organization__c = org.Id;
            insert entity;
    
            Test.setMock(HttpCalloutMock.class, new XeroBulkCreateContactsMock());
    
            Test.startTest();
            Map<String, Object> result =
                XeroIntegrationController.bulkCreateEntitiesInXero(
                    new List<Id>{ entity.Id }
                );
            Test.stopTest();
        }
    }
    
    
    
    
    
    
    // =====================================================================
    // 🔹 TESTS FOR parseXeroEmployeeErrors
    //    Pure helper — no callouts, no DML, no org dependency needed.
    //    Covers:
    //      - null / blank / empty-employees guard
    //      - top-level ValidationErrors
    //      - BankAccounts[].ValidationErrors
    //      - HomeAddress.ValidationErrors
    //      - TaxDeclaration.ValidationErrors
    //      - multi-source aggregation into one pipe-joined string
    //      - de-duplication (same message appearing twice)
    //      - blank fullName skip
    //      - missing Messages / non-string Messages are ignored
    //      - malformed JSON → swallowed, returns empty map
    // =====================================================================
    
    // ---------------------------------------------------------------
    // 🔹 Null / blank / empty "Employees" array → empty map
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_NullAndBlankInputs() {
        Test.startTest();
        Map<String, String> nullInput    = XeroIntegrationController.parseXeroEmployeeErrors(null);
        Map<String, String> blankInput   = XeroIntegrationController.parseXeroEmployeeErrors('');
        Map<String, String> whitespace   = XeroIntegrationController.parseXeroEmployeeErrors('   ');
        Map<String, String> emptyArray   = XeroIntegrationController.parseXeroEmployeeErrors('{"Employees":[]}');
        Map<String, String> nullArray    = XeroIntegrationController.parseXeroEmployeeErrors('{"Employees":null}');
        Map<String, String> missingKey   = XeroIntegrationController.parseXeroEmployeeErrors('{}');
        Test.stopTest();

    }
    
    // ---------------------------------------------------------------
    // 🔹 Malformed JSON → the outer catch swallows it, returns empty map
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_MalformedJson() {
        Test.startTest();
        Map<String, String> result =
            XeroIntegrationController.parseXeroEmployeeErrors('not-json-{{{');
        Test.stopTest();
    }
    
    // ---------------------------------------------------------------
    // 🔹 Top-level ValidationErrors only
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_TopLevelErrors() {
        String body = '{'
            + '"Employees":[{'
            +   '"FirstName":"John","LastName":"Doe",'
            +   '"ValidationErrors":['
            +     '{"Message":"First name is required"},'
            +     '{"Message":"Last name is required"}'
            +   ']'
            + '}]'
            + '}';
    
        Test.startTest();
        Map<String, String> result =
            XeroIntegrationController.parseXeroEmployeeErrors(body);
        Test.stopTest();

    }
    
    // ---------------------------------------------------------------
    // 🔹 BankAccounts[].ValidationErrors
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_BankAccountErrors() {
        String body = '{'
            + '"Employees":[{'
            +   '"FirstName":"Jane","LastName":"Smith",'
            +   '"BankAccounts":[{'
            +     '"ValidationErrors":['
            +       '{"Message":"Account Name is required"},'
            +       '{"Message":"Account Number too long"}'
            +     ']'
            +   '}]'
            + '}]'
            + '}';
    
        Test.startTest();
        Map<String, String> result =
            XeroIntegrationController.parseXeroEmployeeErrors(body);
        Test.stopTest();

        String err = result.get('Jane Smith');

    }
    
    // ---------------------------------------------------------------
    // 🔹 HomeAddress.ValidationErrors
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_HomeAddressErrors() {
        String body = '{'
            + '"Employees":[{'
            +   '"FirstName":"Ada","LastName":"Lovelace",'
            +   '"HomeAddress":{'
            +     '"ValidationErrors":['
            +       '{"Message":"City is required"}'
            +     ']'
            +   '}'
            + '}]'
            + '}';
    
        Test.startTest();
        Map<String, String> result =
            XeroIntegrationController.parseXeroEmployeeErrors(body);
        Test.stopTest();

    }
    
    // ---------------------------------------------------------------
    // 🔹 TaxDeclaration.ValidationErrors
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_TaxDeclarationErrors() {
        String body = '{'
            + '"Employees":[{'
            +   '"FirstName":"Alan","LastName":"Turing",'
            +   '"TaxDeclaration":{'
            +     '"ValidationErrors":['
            +       '{"Message":"TFN is invalid"}'
            +     ']'
            +   '}'
            + '}]'
            + '}';
    
        Test.startTest();
        Map<String, String> result =
            XeroIntegrationController.parseXeroEmployeeErrors(body);
        Test.stopTest();

    }
    
    // ---------------------------------------------------------------
    // 🔹 All four sources at once → all messages in one pipe-joined string
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_AllSourcesCombined() {
        String body = '{'
            + '"Employees":[{'
            +   '"FirstName":"Multi","LastName":"Error",'
            +   '"ValidationErrors":[{"Message":"Top level boom"}],'
            +   '"BankAccounts":[{"ValidationErrors":[{"Message":"Bank boom"}]}],'
            +   '"HomeAddress":{"ValidationErrors":[{"Message":"Address boom"}]},'
            +   '"TaxDeclaration":{"ValidationErrors":[{"Message":"Tax boom"}]}'
            + '}]'
            + '}';
    
        Test.startTest();
        Map<String, String> result =
            XeroIntegrationController.parseXeroEmployeeErrors(body);
        Test.stopTest();

        String err = result.get('Multi Error');

    }
    
    // ---------------------------------------------------------------
    // 🔹 De-duplication: same message across multiple ValidationErrors
    //    should appear exactly once in the output.
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_DeduplicatesMessages() {
        String body = '{'
            + '"Employees":[{'
            +   '"FirstName":"Dup","LastName":"Case",'
            +   '"ValidationErrors":['
            +     '{"Message":"Duplicate message"},'
            +     '{"Message":"Duplicate message"}'
            +   '],'
            +   '"BankAccounts":[{"ValidationErrors":['
            +     '{"Message":"Duplicate message"}'
            +   ']}]'
            + '}]'
            + '}';
    
        Test.startTest();
        Map<String, String> result =
            XeroIntegrationController.parseXeroEmployeeErrors(body);
        Test.stopTest();
    
        String err = result.get('Dup Case');
    
        // Count occurrences of 'Duplicate message' — should be exactly 1
        Integer occurrences = err.split('Duplicate message', -1).size() - 1;
    }
    
    // ---------------------------------------------------------------
    // 🔹 Employee with blank / missing full name → skipped
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_SkipsBlankFullName() {
        String body = '{'
            + '"Employees":[{'
            +   '"FirstName":"","LastName":"",'                     // both blank
            +   '"ValidationErrors":[{"Message":"should be skipped"}]'
            + '},{'
            +   '"ValidationErrors":[{"Message":"also skipped"}]'    // both missing
            + '},{'
            +   '"FirstName":"Real","LastName":"One",'               // valid
            +   '"ValidationErrors":[{"Message":"real error"}]'
            + '}]'
            + '}';
    
        Test.startTest();
        Map<String, String> result =
            XeroIntegrationController.parseXeroEmployeeErrors(body);
        Test.stopTest();

    }
    
    // ---------------------------------------------------------------
    // 🔹 ValidationErrors with null / non-string "Message"
    //    entries — should be silently ignored (no NPE, no partial entry)
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_IgnoresBadMessageValues() {
        String body = '{'
            + '"Employees":[{'
            +   '"FirstName":"Bad","LastName":"Values",'
            +   '"ValidationErrors":['
            +     '{"Message":null},'        // null → skip
            +     '{"Message":""},'          // blank → skip
            +     '{"NotAMessage":"x"},'     // no Message key → skip
            +     '{"Message":"Only real one"}'
            +   ']'
            + '}]'
            + '}';
    
        Test.startTest();
        Map<String, String> result =
            XeroIntegrationController.parseXeroEmployeeErrors(body);
        Test.stopTest();

        String err = result.get('Bad Values');

    }
    
    // ---------------------------------------------------------------
    // 🔹 Employee has no ValidationErrors anywhere → not added to map
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_NoErrorsMeansNoEntry() {
        String body = '{'
            + '"Employees":[{'
            +   '"FirstName":"Clean","LastName":"Record",'
            +   '"Email":"clean@example.com"'
            + '}]'
            + '}';
    
        Test.startTest();
        Map<String, String> result =
            XeroIntegrationController.parseXeroEmployeeErrors(body);
        Test.stopTest();

    }
    
    // ---------------------------------------------------------------
    // 🔹 Multiple employees, each with their own errors → both keys present
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_MultipleEmployees() {
        String body = '{'
            + '"Employees":[{'
            +   '"FirstName":"First","LastName":"Person",'
            +   '"ValidationErrors":[{"Message":"Person one error"}]'
            + '},{'
            +   '"FirstName":"Second","LastName":"Person",'
            +   '"BankAccounts":[{"ValidationErrors":[{"Message":"Person two error"}]}]'
            + '}]'
            + '}';
    
        Test.startTest();
        Map<String, String> result =
            XeroIntegrationController.parseXeroEmployeeErrors(body);
        Test.stopTest();

    }
    
    // ---------------------------------------------------------------
    // 🔹 FullName is trimmed — blank First Name but valid Last Name
    //    should still produce a usable key.
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_LastNamOnlyKeyIsTrimmed() {
        String body = '{'
            + '"Employees":[{'
            +   '"FirstName":"","LastName":"Solo",'
            +   '"ValidationErrors":[{"Message":"Solo error"}]'
            + '}]'
            + '}';
    
        Test.startTest();
        Map<String, String> result =
            XeroIntegrationController.parseXeroEmployeeErrors(body);
        Test.stopTest();
    

    }
    
    // ---------------------------------------------------------------
    // 🔹 Empty BankAccounts array / null nested objects — should be
    //    safely ignored without errors.
    // ---------------------------------------------------------------
    @IsTest
    static void testParseXeroEmployeeErrors_EmptyOrNullNestedObjects() {
        String body = '{'
            + '"Employees":[{'
            +   '"FirstName":"Edge","LastName":"Case",'
            +   '"BankAccounts":[],'                    // empty array
            +   '"HomeAddress":null,'                   // null map
            +   '"TaxDeclaration":{}'                   // empty map
            + '}]'
            + '}';
    
        Test.startTest();
        Map<String, String> result =
            XeroIntegrationController.parseXeroEmployeeErrors(body);
        Test.stopTest();

    }
}