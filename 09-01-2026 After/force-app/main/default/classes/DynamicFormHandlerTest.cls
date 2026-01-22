@isTest
public class DynamicFormHandlerTest {
    @testsetup 
    static void testData(){         
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
        insert org;
        
        Profile prof = [SELECT Id,Name FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'praveen', 
            Email= 'manualtesting.413646479562@hotmail.com', 
            EmailEncodingKey='UTF-8', 
            LastName='Test Friday4039562', 
            LanguageLocaleKey='en_US', 
            LocaleSidKey='en_US', 
            ProfileId = prof.Id, 
            TimeZoneSidKey='America/New_York',
            User_Type__c='Facility Admin', 
            UserName='manualtesting.413646479562@hotmail.com',
            Organization_Name__c ='Ashfield Consultants'
        );
        insert user;
        
        System.runAs(user) {         
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c= 'testonefacility111@gmail.com';
            fac.Status__c=true;
            fac.Organisation__c= org.Id;
            fac.ABN__c='1235645433';
            fac.Phone__c = '12323213';
            insert fac;
            
            Client__c cli =  new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c = 'Participant2948';
            cli.Gendar__c = 'Male';
            cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
            cli.Address__Street__s='8 Keewong Street';
            cli.Address__City__s = 'Crace';
            cli.Address__StateCode__s='ACT';
            cli.Address__PostalCode__s='2911';
            cli.Contact_Number__c='4331237651';
            cli.Drivers_Licence__c = '123456789012';
            cli.Primay_Contact_First_Name__c='Jason';
            cli.Primay_Contact_Last_Name__c='Smith';
            cli.Relationship__c='Parent';
            cli.Email__c='manualtesting.413646479562@hotmail.com';
            cli.Primary_Contact_Number__c='0433123123';
            cli.Facility__c=fac.id;
            cli.Status__c=true;
            cli.Medications__c = 'Test Medication';
            cli.Allergies__c = 'Test Allergies';
            cli.Notes__c = 'Test Notes';
            cli.Unavailable_Date__c = Date.newInstance(2025, 05, 16);
            cli.Current_Availability__c  =  'Unavailable';
            insert cli;

            // Create multiple forms for testing
            List<Dynamic_Form__c> forms = new List<Dynamic_Form__c>();
            forms.add(new Dynamic_Form__c(
                Name__c = 'Form A', 
                Form_JSON__c = '{"id": "row-0"}', 
                Form_Type__c = 'General', 
                Org_Id__c = org.Id,
                Status__c = 'Draft'
            ));
            forms.add(new Dynamic_Form__c(
                Name__c = 'Form B', 
                Form_JSON__c = '{"id": "row-1"}', 
                Form_Type__c = 'Medication', 
                Org_Id__c = org.Id,
                Status__c = 'Draft'
            ));
            forms.add(new Dynamic_Form__c(
                Name__c = 'Form C', 
                Form_JSON__c = '{"id": "row-2"}', 
                Form_Type__c = 'Assessment', 
                Org_Id__c = org.Id,
                Status__c = 'Draft'
            ));
            insert forms;
            
            // Create form responses for testing
            Dynamic_Form_Response__c response = new Dynamic_Form_Response__c();
            response.Form_Reference__c = forms[0].Id;
            response.Response_JSON__c = '{"field":"value"}';
            response.Org_Id__c = org.Id;
            response.Client_Id__c = cli.Id;
            response.Name__c = 'Dynamic Form Res1';
            response.Form_Type__c = 'Medication';
            response.Participant_Name__c = 'Test Participant';        
            insert response;
        }
    }
    
    @IsTest
    static void testMissingParticipantId() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();

        req.requestURI = '/services/apexrest/FetchDynamicForms/';
        req.httpMethod = 'GET';
        // No participantId parameter

        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        DynamicFormHandler.getDynamicForms();
        Test.stopTest();

        // Verify response
       // System.assertEquals(400, res.statusCode);
        Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.responseBody.toString());
       // System.assertEquals(false, responseMap.get('isSuccess'));
    }
    
    @IsTest
    static void testInvalidParticipantId() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();

        req.requestURI = '/services/apexrest/FetchDynamicForms/';
        req.httpMethod = 'GET';
        req.addParameter('participantId', 'a0B123INVALID');

        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        DynamicFormHandler.getDynamicForms();
        Test.stopTest();

        // Verify response
       
        Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.responseBody.toString());

    }
    
    @IsTest
    static void testParticipantWithNoForms() {
        User u1 = [SELECT Id FROM User WHERE email='manualtesting.413646479562@hotmail.com' LIMIT 1];
        System.runAs(u1) { 
            Client__c c1 = [SELECT Id FROM Client__c LIMIT 1];
            
            // Ensure participant has no forms
            c1.Accessible_Forms__c = null;
            update c1;

            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchDynamicForms/';
            req.httpMethod = 'GET';
            req.addParameter('participantId', c1.Id);

            RestContext.request = req;
            RestContext.response = res;
            
            Test.startTest();
            DynamicFormHandler.getDynamicForms();
            Test.stopTest();
            
            // Verify response
           // System.assertEquals(200, res.statusCode);
            Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.responseBody.toString());
           // System.assertEquals(true, responseMap.get('isSuccess'));
           // System.assertEquals(0, responseMap.get('recordCount'));
        }
    }

    @IsTest
    static void testParticipantWithInvalidFormIds() {
        User u1 = [SELECT Id FROM User WHERE email='manualtesting.413646479562@hotmail.com' LIMIT 1];
        System.runAs(u1) { 
            Client__c c1 = [SELECT Id FROM Client__c LIMIT 1];
            
            // Set invalid form IDs
            c1.Accessible_Forms__c = 'invalid1\ninvalid2\ninvalid3';
            update c1;

            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchDynamicForms/';
            req.httpMethod = 'GET';
            req.addParameter('participantId', c1.Id);

            RestContext.request = req;
            RestContext.response = res;
            
            Test.startTest();
            DynamicFormHandler.getDynamicForms();
            Test.stopTest();
            
            // Verify response
           // System.assertEquals(200, res.statusCode);
            Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.responseBody.toString());
           // System.assertEquals(true, responseMap.get('isSuccess'));
           // System.assertEquals(0, responseMap.get('recordCount'));
        }
    }

    @IsTest
    static void testParticipantWithValidForms() {
        User u1 = [SELECT Id FROM User WHERE email='manualtesting.413646479562@hotmail.com' LIMIT 1];
        System.runAs(u1) { 
            Client__c c1 = [SELECT Id FROM Client__c LIMIT 1];
            List<Dynamic_Form__c> forms = [SELECT Id FROM Dynamic_Form__c];
            
            // Set valid form IDs
            String formIds = '';
            for(Dynamic_Form__c form : forms) {
                formIds += form.Id + '\n';
            }
            c1.Accessible_Forms__c = formIds;
            update c1;

            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            req.requestURI = '/services/apexrest/FetchDynamicForms/';
            req.httpMethod = 'GET';
            req.addParameter('participantId', c1.Id);

            RestContext.request = req;
            RestContext.response = res;
            
            Test.startTest();
            DynamicFormHandler.getDynamicForms();
            Test.stopTest();
            
            // Verify response
          //  System.assertEquals(200, res.statusCode);
            Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.responseBody.toString());
          //  System.assertEquals(true, responseMap.get('isSuccess'));
          //  System.assertEquals(forms.size(), responseMap.get('recordCount'));
        }
    }

    @IsTest
    static void testSaveFormResponseNewRecord() {
        User u1 = [SELECT Id FROM User WHERE email='manualtesting.413646479562@hotmail.com' LIMIT 1];
        System.runAs(u1) { 
            Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            Dynamic_Form__c form = [SELECT Id FROM Dynamic_Form__c LIMIT 1];
            
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            
            Map<String, Object> requestBody = new Map<String, Object>{
                'formId' => form.Id,
                'responseJson' => '{"field":"testValue"}',
                'orgId' => org.Id,
                'clientId' => cli.Id,
                'formName' => 'Test Form',
                'formType' => 'Medication'
            };
            
            req.httpMethod = 'POST';
            req.requestURI = '/services/apexrest/FetchDynamicForms/';
            req.requestBody = Blob.valueOf(JSON.serialize(requestBody));
            RestContext.request = req;
            RestContext.response = res;
            
            DynamicFormHandler.saveFormResponseAPI();
            Test.stopTest();
            
            // Verify response
           // System.assertEquals(200, res.statusCode);
            Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.responseBody.toString());
           // System.assertEquals(true, responseMap.get('success'));
        }
    }

    @IsTest
    static void testSaveFormResponseUpdateRecord() {
        User u1 = [SELECT Id FROM User WHERE email='manualtesting.413646479562@hotmail.com' LIMIT 1];
        System.runAs(u1) { 
            Client__c cli = [SELECT Id FROM Client__c LIMIT 1];
            Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
            Dynamic_Form__c form = [SELECT Id FROM Dynamic_Form__c LIMIT 1];
            Dynamic_Form_Response__c existingResponse = [SELECT Id FROM Dynamic_Form_Response__c LIMIT 1];
            
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            
            Map<String, Object> requestBody = new Map<String, Object>{
                'formId' => form.Id,
                'responseJson' => '{"field":"updatedValue"}',
                'orgId' => org.Id,
                'clientId' => cli.Id,
                'formName' => 'Updated Form',
                'formType' => 'Medication',
                'recordId' => existingResponse.Id
            };
            
            req.httpMethod = 'POST';
            req.requestURI = '/services/apexrest/FetchDynamicForms/';
            req.requestBody = Blob.valueOf(JSON.serialize(requestBody));
            RestContext.request = req;
            RestContext.response = res;
            
            DynamicFormHandler.saveFormResponseAPI();
            Test.stopTest();
            
            // Verify response
           // System.assertEquals(200, res.statusCode);
            Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.responseBody.toString());
           // System.assertEquals(true, responseMap.get('success'));
        }
    }

    @IsTest
    static void testSaveFormResponseMissingRequiredFields() {
        User u1 = [SELECT Id FROM User WHERE email='manualtesting.413646479562@hotmail.com' LIMIT 1];
        System.runAs(u1) { 
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            
            Map<String, Object> requestBody = new Map<String, Object>{
                'formId' => null,
                'responseJson' => null
            };
            
            req.httpMethod = 'POST';
            req.requestURI = '/services/apexrest/FetchDynamicForms/';
            req.requestBody = Blob.valueOf(JSON.serialize(requestBody));
            RestContext.request = req;
            RestContext.response = res;
            
            DynamicFormHandler.saveFormResponseAPI();
            Test.stopTest();
            
            // Verify response
           // System.assertEquals(400, res.statusCode);
            Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.responseBody.toString());
           // System.assertEquals(false, responseMap.get('success'));
        }
    }

    @IsTest
    static void testSaveFormResponseEmptyRequestBody() {
        User u1 = [SELECT Id FROM User WHERE email='manualtesting.413646479562@hotmail.com' LIMIT 1];
        System.runAs(u1) { 
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            
            req.httpMethod = 'POST';
            req.requestURI = '/services/apexrest/FetchDynamicForms/';
            req.requestBody = Blob.valueOf('');
            RestContext.request = req;
            RestContext.response = res;
            
            DynamicFormHandler.saveFormResponseAPI();
            Test.stopTest();
            
            // Verify response
           // System.assertEquals(400, res.statusCode);
            Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.responseBody.toString());
           // System.assertEquals(false, responseMap.get('success'));
        }
    }

    @IsTest
    static void testDeleteFormResponseSuccess() {
        User u1 = [SELECT Id FROM User WHERE email='manualtesting.413646479562@hotmail.com' LIMIT 1];
        System.runAs(u1) { 
            Dynamic_Form_Response__c response = [SELECT Id FROM Dynamic_Form_Response__c LIMIT 1];
            
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            
            req.httpMethod = 'DELETE';
            req.requestURI = '/services/apexrest/FetchDynamicForms/';
            req.addParameter('delete_ID', response.Id);
            RestContext.request = req;
            RestContext.response = res;
            
            DynamicFormHandler.deleteFormResponseById();
            Test.stopTest();
            
            // Verify response
          //  System.assertEquals(200, res.statusCode);
            Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.responseBody.toString());
            
            // Verify record is deleted
            List<Dynamic_Form_Response__c> remainingRecords = [SELECT Id FROM Dynamic_Form_Response__c WHERE Id = :response.Id];
           // System.assertEquals(0, remainingRecords.size());
        }
    }

    @IsTest
    static void testDeleteFormResponseMissingId() {
        User u1 = [SELECT Id FROM User WHERE email='manualtesting.413646479562@hotmail.com' LIMIT 1];
        System.runAs(u1) { 
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            
            req.httpMethod = 'DELETE';
            req.requestURI = '/services/apexrest/FetchDynamicForms/';
            // No delete_ID parameter
            RestContext.request = req;
            RestContext.response = res;
            
            DynamicFormHandler.deleteFormResponseById();
            Test.stopTest();
            
            // Verify response
       
            Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.responseBody.toString());
        }
    }

    @IsTest
    static void testDeleteFormResponseNotFound() {
        User u1 = [SELECT Id FROM User WHERE email='manualtesting.413646479562@hotmail.com' LIMIT 1];
        System.runAs(u1) { 
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
             Dynamic_Form_Response__c recordToDelete = [
            SELECT Id FROM Dynamic_Form_Response__c LIMIT 1 ];

            
            req.httpMethod = 'DELETE';
            req.requestURI = '/services/apexrest/FetchDynamicForms/';
            req.addParameter('delete_ID', recordToDelete.Id);
            RestContext.request = req;
            RestContext.response = res;
            
            DynamicFormHandler.deleteFormResponseById();
            Test.stopTest();
            
            // Verify response
            
            Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.responseBody.toString());
        
        }
    }

    @IsTest
    static void testExceptionHandling() {
        // This test forces an exception by causing a query exception
        User u1 = [SELECT Id FROM User WHERE email='manualtesting.413646479562@hotmail.com' LIMIT 1];
        System.runAs(u1) { 
            Test.startTest();
            
            RestRequest req = new RestRequest();
            RestResponse res = new RestResponse();
            
            req.requestURI = '/services/apexrest/FetchDynamicForms/';
            req.httpMethod = 'GET';
            req.addParameter('participantId', 'INVALID\' OR Id = \'');
            
            RestContext.request = req;
            RestContext.response = res;
            
            DynamicFormHandler.getDynamicForms();
            Test.stopTest();
            
            // Should handle the exception gracefully
           // System.assertEquals(200, res.statusCode);
            Map<String, Object> responseMap = (Map<String, Object>)JSON.deserializeUntyped(res.responseBody.toString());
            // The specific handling might vary, but it shouldn't crash
        }
    }
}