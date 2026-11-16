@isTest
public class FormControllerTest {
    
    // =============================================
    // TEST SETUP - Runs ONCE for all test methods
    // =============================================
    @TestSetup
    static void setupTestData() {
        // Bypass triggers
        TriggerUtility.bypassTrigger = true;
        
        // =============================================
        // CREATE ORGANISATION
        // =============================================
        Organisation__c org = new Organisation__c();
        org.Name = 'Ashfield Consultants';
        org.ABN__c = '11234567891';
        org.ACN__c = '878787878';
        org.Contact_No__c = '6132899740';
        org.RCTI__c = 'RCTI1';
        org.Email__c = 'dsfdsfsd@gmail.com';
        org.Bank__c = 'Bank Test';
        org.BSB__c = 'BSB Test';
        org.Account_Name__c = 'Test Account';
        org.Account_Number__c = '1111111111';
        org.Description__c = 'test Desc';
        org.Address_Latest__Street__s = '101';
        org.Address_Latest__City__s = 'Himas Waterhen';
        org.Address_Latest__PostalCode__s = '2060';
        org.Address_Latest__CountryCode__s = 'AU';
        org.Address_Latest__StateCode__s = 'NSW';
        org.NDIS_Provider__c = '12341234565';
        org.BMSI_Identifier__c = 'TEST BMSI';
        org.SoftwareId__c = 'jhdfn18328';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        org.Week_Start_Day__c = 'Monday';
        org.Roles__c = 'Admin;AIN';
        insert org;
        
        // =============================================
        // CREATE USER
        // =============================================
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        
        User user = new User(
            Alias = 'testuser',
            Email = 'testuser12345678987654@example.com',
            EmailEncodingKey = 'UTF-8',
            LastName = 'TestUser',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = prof.Id,
            TimeZoneSidKey = 'America/New_York',
            UserName = 'testuser12345678987654@example.com',
            User_Type__c = 'NDIS Org Admin',
            Organization_Name__c = 'Ashfield Consultants'
        );
        insert user;
        
        // =============================================
        // CREATE FACILITY
        // =============================================
        System.runAs(user) {
            Facility__c fac = new Facility__c();
            fac.Name = 'Ashfield Consultants';
            fac.Address__City__s = 'Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s = 'ACT';
            fac.Address__PostalCode__s = '2911';
            fac.Address__CountryCode__s = 'AU';
            fac.Email__c = 'testonefacility@gmail.com';
            fac.Status__c = true;
            fac.Organisation__c = org.Id;
            fac.ABN__c = '12345678901';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c = 'Ndis';
            insert fac;
            
            // =============================================
            // CREATE STAFF
            // =============================================
            Staff__c staff = new Staff__c();
            staff.Last_Name__c = 'Test staff';
            staff.Name = 'praveen1';
            staff.Name__c = 'abcd';
            staff.Contact_Number__c = '56789908743';
            staff.Email_Address__c = user.Email;
            staff.Facility__c = fac.Id;
            staff.Address__Street__s = '8 Keewong Street';
            staff.Address__City__s = 'Crace';
            staff.Address__StateCode__s = 'ACT';
            staff.Address__PostalCode__s = '2911';
            staff.Emergency_Phone_Number__c = '45678766675';
            staff.Primary_Contact_Name__c = 'Praveen';
            staff.Primary_Contact_Number__c = '9908458298';
            staff.Make_Primary_as_Approver__c = true;
            staff.Primary_Contact_Email__c = 'praveenshesham.sp@gmail.com';
            staff.Secondary_Contact_Name__c = 'maheswari';
            staff.Secondary_Contact_Email__c = 'maheswari.adabala@gmail.com';
            staff.Make_Secondary_as_Approver__c = false;
            staff.Secondary_Contact_Number__c = '99084582958';
            staff.Emp_exit_date__c = Date.newInstance(2028, 1, 5);
            staff.Emp_Start_Date__c = Date.newInstance(2023, 2, 1);
            staff.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 2, 4);
            staff.Date_Of_Birth__c = Date.newInstance(2001, 2, 4);
            staff.role__c = 'Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = Date.newInstance(2025, 2, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c = 50;
            staff.Final_Overall_Rate__c = 150;
            staff.Saturday_Hourly_Rate__c = 130;
            staff.Sunday_Hourly_Rate__c = 50;
            staff.Status__c = true;
            staff.Restrict_Set_Hours__c = false;
            staff.Set_Hours__c = 40;
            insert staff;
            
            // =============================================
            // CREATE CLIENT
            // =============================================
            Client__c cli = new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c = 'Client';
            cli.Gendar__c = 'Male';
            cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
            cli.Address__Street__s = 'Street';
            cli.Address__City__s = 'City';
            cli.Address__StateCode__s = 'ACT';
            cli.Address__PostalCode__s = '2911';
            cli.Contact_Number__c = '4331237651';
            cli.Drivers_Licence__c = '123456789012';
            cli.Primay_Contact_First_Name__c = 'Jason';
            cli.Primay_Contact_Last_Name__c = 'Smith';
            cli.Relationship__c = 'Parent';
            cli.Email__c = 'client@test.com';
            cli.Primary_Contact_Number__c = '0433123123';
            cli.Facility__c = fac.Id;
            cli.Status__c = true;
            cli.Medications__c = 'Test Medication';
            cli.Allergies__c = 'Test Allergies';
            cli.Notes__c = 'Test Notes';
            cli.Accessible_Forms__c = 'Test Accessible Form';
            cli.Unavailable_Date__c = Date.newInstance(2025, 5, 16);
            insert cli;
            
            // =============================================
            // CREATE DYNAMIC FORMS
            // =============================================
            Dynamic_Form__c form1 = new Dynamic_Form__c();
            form1.Name__c = 'Test Form Name';
            form1.Form_JSON__c = '{"id":"row-0"}';
            form1.Form_Type__c = 'Medication';
            form1.Org_Id__c = org.Id;
            form1.Audience__c = 'Staff';
            insert form1;
            
            Dynamic_Form__c form2 = new Dynamic_Form__c();
            form2.Name__c = 'General Form';
            form2.Form_JSON__c = '{"id":"row-1"}';
            form2.Form_Type__c = 'General';
            form2.Org_Id__c = org.Id;
            form2.Audience__c = 'Participant';
            insert form2;
            
            // =============================================
            // CREATE DYNAMIC FORM RESPONSE
            // =============================================
            Dynamic_Form_Response__c response = new Dynamic_Form_Response__c();
            response.Form_Reference__c = form1.Id;
            response.Response_JSON__c = '{"id":"row-0"}';
            response.Org_Id__c = org.Id;
            response.Client_Id__c = cli.Id;
            response.Name__c = 'Dynamic Form Res1';
            response.Form_Type__c = 'Medication';
            response.Participant_Name__c = 'Test Participant';
            response.Status__c = 'Completed';
            response.Staff__c = staff.Id;
            response.Staff_Name__c = staff.Name;
            insert response;
            
            // =============================================
            // CREATE OFFER TEMPLATE AND SIGNATURES
            // =============================================
            Offer_Template__c offer = new Offer_Template__c();
            offer.File_Name__c = 'Offer.pdf';
            offer.Dynamic_Form_Response__c = response.Id;
            offer.All_Recipients__c = 'First <first@example.com>\nLast <last@example.com>';
            offer.Current_Recipient__c = 'Last <LAST@EXAMPLE.COM>';
            offer.Current_Recipient_Status__c = 'Completed';
            offer.Orgnisation_Id__c = org.Id;
            offer.Type__c = 'Default';
            offer.Comments__c = 'Test';
            insert offer;
            
            Child_Signatures__c sig = new Child_Signatures__c();
            sig.Offer_Template__c = offer.Id;
            sig.Signature_URL__c = 'https://example.com/signature.pdf';
            insert sig;
            
            // =============================================
            // CREATE PARTICIPANT FACILITY (for getParticipantsFilter)
            // =============================================
            Participant_Facility__c pf = new Participant_Facility__c();
            pf.Participant__c = cli.Id;
            pf.Facility__c = fac.Id;
            pf.Active__c = true;
            insert pf;
        }
    }
    
    // =============================================
    // HELPER METHODS (QUERY ONLY - NO INSERT)
    // =============================================
    static User getTestUser() {
        return [SELECT Id, Email, User_Type__c FROM User WHERE Email = 'testuser12345678987654@example.com' LIMIT 1];
    }
    
    static Organisation__c getTestOrg() {
        return [SELECT Id, Name FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    }
    
    static Facility__c getTestFacility() {
        return [SELECT Id, Name FROM Facility__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
    }
    
    static Staff__c getTestStaff() {
        return [SELECT Id, Name, Email_Address__c, Accessible_Custom_Forms__c FROM Staff__c WHERE Email_Address__c = 'testuser12345678987654@example.com' LIMIT 1];
    }
    
    static Client__c getTestClient() {
        return [SELECT Id, Name, Accessible_Forms__c FROM Client__c WHERE First_Name__c = 'Test' AND Last_Name__c = 'Client' LIMIT 1];
    }
    
    static Dynamic_Form__c getTestForm() {
        return [SELECT Id, Name__c, Form_Type__c, Org_Id__c, Audience__c FROM Dynamic_Form__c WHERE Name__c = 'Test Form Name' LIMIT 1];
    }
    
    static Dynamic_Form_Response__c getTestResponse() {
        return [SELECT Id, Name__c, Form_Type__c, Response_JSON__c, Participant_Name__c, Staff_Name__c, Status__c FROM Dynamic_Form_Response__c LIMIT 1];
    }
    
    // =============================================
    // TEST 1: saveForm
    // =============================================
    @isTest
    static void testSaveForm() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        
        Test.startTest();
        System.runAs(u) {
            FormController.saveForm('New Form', '{"Id":"row-0"}', 'Assessment', org.Id, 'Staff');
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 2: doesPublishedFormExist
    // =============================================
    @isTest
    static void testDoesPublishedFormExist() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        
        Test.startTest();
        System.runAs(u) {
            Boolean result = FormController.doesPublishedFormExist('Test Form Name', org.Id, 'Staff');
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 3: getForms
    // =============================================
    @isTest
    static void testGetForms() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        
        Test.startTest();
        System.runAs(u) {
            List<Dynamic_Form__c> result = FormController.getForms(org.Id);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 4: getFormsByClient
    // =============================================
    @isTest
    static void testGetFormsByClient() {
        User u = getTestUser();
        Client__c cli = getTestClient();
        Organisation__c org = getTestOrg();
        
        Test.startTest();
        System.runAs(u) {
            List<Dynamic_Form__c> result = FormController.getFormsByClient(cli.Id, org.Id);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 5: saveFormResponse
    // =============================================
    @isTest
    static void testSaveFormResponse() {
        User u = getTestUser();
        Dynamic_Form__c form = getTestForm();
        Organisation__c org = getTestOrg();
        Client__c cli = getTestClient();
        
        Test.startTest();
        System.runAs(u) {
            Dynamic_Form_Response__c result = FormController.saveFormResponse(
                form.Id, '{"Id":"row-0"}', org.Id, cli.Id, 'Assessment', 'Medication', 'Pending'
            );
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 6: getFormResponses
    // =============================================
    @isTest
    static void testGetFormResponses() {
        User u = getTestUser();
        
        Test.startTest();
        System.runAs(u) {
            List<Dynamic_Form_Response__c> result = FormController.getFormResponses();
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 7: getFormResponsesByClient
    // =============================================
    @isTest
    static void testGetFormResponsesByClient() {
        User u = getTestUser();
        Client__c cli = getTestClient();
        
        Test.startTest();
        System.runAs(u) {
            List<Dynamic_Form_Response__c> result = FormController.getFormResponsesByClient(cli.Id);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 8: getClientEmailByClientId
    // =============================================
    @isTest
    static void testGetClientEmailByClientId() {
        User u = getTestUser();
        Client__c cli = getTestClient();
        
        Test.startTest();
        System.runAs(u) {
            String result1 = FormController.getClientEmailByClientId(null);
            String result2 = FormController.getClientEmailByClientId('');
           // String result3 = FormController.getClientEmailByClientId('123');
            String result4 = FormController.getClientEmailByClientId(String.valueOf(cli.Id));
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 9: getFormResponsesFiltered
    // =============================================
    @isTest
    static void testGetFormResponsesFiltered() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        
        Test.startTest();
        System.runAs(u) {
            List<Dynamic_Form_Response__c> result1 = FormController.getFormResponsesFiltered(null, null);
            List<Dynamic_Form_Response__c> result2 = FormController.getFormResponsesFiltered('Staff', null);
            List<Dynamic_Form_Response__c> result3 = FormController.getFormResponsesFiltered(null, String.valueOf(org.Id));
            List<Dynamic_Form_Response__c> result4 = FormController.getFormResponsesFiltered('Participant', String.valueOf(org.Id));
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 10: updateFormResponse
    // =============================================
    @isTest
    static void testUpdateFormResponse() {
        User u = getTestUser();
        Dynamic_Form_Response__c response = getTestResponse();
        
        Test.startTest();
        System.runAs(u) {
            Dynamic_Form_Response__c result = FormController.updateFormResponse(
                response.Id, '{"updated":"yes"}', 'Completed'
            );
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 11: updateAwsFields
    // =============================================
    @isTest
    static void testUpdateAwsFields() {
        User u = getTestUser();
        Dynamic_Form_Response__c response = getTestResponse();
        
        Test.startTest();
        System.runAs(u) {
            FormController.updateAwsFields(response.Id, 'https://aws.test/file.json', '{"bucket":"test","key":"abc"}');
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 12: deleteFormResponse
    // =============================================
    @isTest
    static void testDeleteFormResponse() {
        User u = getTestUser();
        Dynamic_Form_Response__c response = getTestResponse();
        
        Test.startTest();
        System.runAs(u) {
            FormController.deleteFormResponse(response.Id);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 13: getParticipantsFilter
    // =============================================
    @isTest
    static void testGetParticipantsFilter() {
        User u = getTestUser();
        Facility__c fac = getTestFacility();
        
        Test.startTest();
        System.runAs(u) {
            List<Map<String, Object>> result = FormController.getParticipantsFilter(new List<Id>{fac.Id});
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 14: getParticipants
    // =============================================
    @isTest
    static void testGetParticipants() {
        User u = getTestUser();
        Facility__c fac = getTestFacility();
        
        Test.startTest();
        System.runAs(u) {
            List<Map<String, Object>> result = FormController.getParticipants(String.valueOf(fac.Id));
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 15: getAvailableForms
    // =============================================
    @isTest
    static void testGetAvailableForms() {
        User u = getTestUser();
        
        Test.startTest();
        System.runAs(u) {
            List<Dynamic_Form__c> result = FormController.getAvailableForms();
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 16: getAccessibleForms (Participant)
    // =============================================
    @isTest
    static void testGetAccessibleForms_Participant() {
        User u = getTestUser();
        Client__c cli = getTestClient();
        
        Test.startTest();
        System.runAs(u) {
            List<Dynamic_Form__c> result = FormController.getAccessibleForms(cli.Id);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 17: getParticipantForms
    // =============================================
    @isTest
    static void testGetParticipantForms() {
        User u = getTestUser();
        Client__c cli = getTestClient();
        
        Test.startTest();
        System.runAs(u) {
            List<Dynamic_Form__c> result = FormController.getParticipantForms(cli.Id);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 18: grantAccessToParticipants
    // =============================================
    @isTest
    static void testGrantAccessToParticipants() {
        User u = getTestUser();
        Client__c cli = getTestClient();
        Dynamic_Form__c form = getTestForm();
        
        Test.startTest();
        System.runAs(u) {
            FormController.grantAccessToParticipants(new List<Id>{cli.Id}, form.Id);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 19: revokeAccessFromParticipants
    // =============================================
    @isTest
    static void testRevokeAccessFromParticipants() {
        User u = getTestUser();
        Client__c cli = getTestClient();
        Dynamic_Form__c form = getTestForm();
        
        // First grant access
        FormController.grantAccessToParticipants(new List<Id>{cli.Id}, form.Id);
        
        Test.startTest();
        System.runAs(u) {
            FormController.revokeAccessFromParticipants(new List<Id>{cli.Id}, form.Id);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 20: uploadFileToSalesforce
    // =============================================
    @isTest
    static void testUploadFileToSalesforce() {
        String fileData = EncodingUtil.base64Encode(Blob.valueOf('Hello World'));
        
        Test.startTest();
        FormController.uploadFileToSalesforce(fileData, 'TestFile.txt', 'text/plain');
        Test.stopTest();
    }
    
    // =============================================
    // TEST 21: getStaffEmailByName
    // =============================================
    @isTest
    static void testGetStaffEmailByName() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        System.runAs(u) {
            String result = FormController.getStaffEmailByName(staff.Name);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 22: getFacilityByUserEmail
    // =============================================
    @isTest
    static void testGetFacilityByUserEmail() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        System.runAs(u) {
            String result = FormController.getFacilityByUserEmail(staff.Email_Address__c);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 23: getParticipantsByOrgId
    // =============================================
    @isTest
    static void testGetParticipantsByOrgId() {
        User u = getTestUser();
        Organisation__c org = getTestOrg();
        
        Test.startTest();
        System.runAs(u) {
            List<Client__c> result = FormController.getParticipantsByOrgId(org.Id);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 24: checkFormSignatureStatus
    // =============================================
    @isTest
    static void testCheckFormSignatureStatus() {
        User u = getTestUser();
        Dynamic_Form_Response__c response = getTestResponse();
        
        Test.startTest();
        System.runAs(u) {
            Map<String, Object> result = FormController.checkFormSignatureStatus(response.Id);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 25: fetchFacilitiess
    // =============================================
    @isTest
    static void testFetchFacilitiess() {
        User u = getTestUser();
        
        Test.startTest();
        System.runAs(u) {
            List<Facility__c> result = FormController.fetchFacilitiess();
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 26: getStaffForCurrentUser
    // =============================================
    @isTest
    static void testGetStaffForCurrentUser() {
        User u = getTestUser();
        
        Test.startTest();
        System.runAs(u) {
            Staff__c result = FormController.getStaffForCurrentUser();
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 27: getAccessibleStaffForms
    // =============================================
    @isTest
    static void testGetAccessibleStaffForms() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        System.runAs(u) {
            List<Dynamic_Form__c> result = FormController.getAccessibleStaffForms(staff.Id);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 28: saveStaffFormResponse
    // =============================================
    @isTest
    static void testSaveStaffFormResponse() {
        User u = getTestUser();
        Dynamic_Form__c form = getTestForm();
        Organisation__c org = getTestOrg();
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        System.runAs(u) {
            Dynamic_Form_Response__c result = FormController.saveStaffFormResponse(
                form.Id, '{"Id":"row-0"}', String.valueOf(org.Id), staff.Id, 'Staff Form', 'Medication', 'Pending'
            );
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 29: updateStaffFormResponse
    // =============================================
    @isTest
    static void testUpdateStaffFormResponse() {
        User u = getTestUser();
        Dynamic_Form_Response__c response = getTestResponse();
        
        Test.startTest();
        System.runAs(u) {
            Dynamic_Form_Response__c result = FormController.updateStaffFormResponse(
                response.Id, '{"updated":"yes"}', 'Completed'
            );
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 30: getFormResponsesByStaff
    // =============================================
    @isTest
    static void testGetFormResponsesByStaff() {
        User u = getTestUser();
        Staff__c staff = getTestStaff();
        
        Test.startTest();
        System.runAs(u) {
            List<Dynamic_Form_Response__c> result = FormController.getFormResponsesByStaff(staff.Id);
        }
        Test.stopTest();
    }
    
    // =============================================
    // TEST 31: getEmployeeData
    // =============================================
    @isTest
    static void testGetEmployeeData() {
        User u = getTestUser();
        Facility__c fac = getTestFacility();
        
        Test.startTest();
        System.runAs(u) {
            List<Staff__c> result = FormController.getEmployeeData(String.valueOf(fac.Id));
        }
        Test.stopTest();
    }
}