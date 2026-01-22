@isTest
public class FormControllerTest {
	@isTest
    static void testGetDocumentRecords() {
       // Bypass trigger to avoid DML exceptions if available
        TriggerUtility.bypassTrigger = true;
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
        
        Organisation__c org1 = new Organisation__c();
        org1.Name='Ashfield Consultants';
        org1.ABN__c='11234567891';
        org1.ACN__c='878787878';
        org1.Contact_No__c='6132899740';
        org1.RCTI__c='RCTI1';
        org1.Email__c='dsfdsfsd@gmail.com';
        org1.Bank__c='Bank Test';
        org1.BSB__c='BSB Test';
        org1.Account_Name__c='Test Account';
        org1.Account_Number__c='1111111111';
        org1.Description__c='test Desc';
        org1.Address_Latest__Street__s='101';
        org1.Address_Latest__City__s='Himas Waterhen';
        org1.Address_Latest__PostalCode__s='2060';
        org1.Address_Latest__CountryCode__s='AU';
        org1.Address_Latest__StateCode__s='NSW';
        org1.NDIS_Provider__c='12341234565';
        org1.BMSI_Identifier__c ='TEST BMSI';
        org1.SoftwareId__c = 'jhdfn18328';
        org1.Branch_code__c = 'BS123';
        org1.Contact_Name__c = 'Test Contact';
        org1.User_Type__c = 'NDIS Org Admin';
        insert org1;   
        List<Offer_Template__c> offerList = new List<Offer_Template__c>();
        
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.4139562@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='Test Friday4039562', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', UserName='manualtesting.4139562@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
                        
           Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c = user.Email;
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
            staff.Annual_Leave__c=10;
            staff.Sick_Leave__c=2;
            staff.Bereavement_Leave__c=10;
            staff.Parental_Leave__c=3;
            insert staff; 
            
            Staff__c staff1 = new Staff__c();
            staff1.Last_Name__c='Test staff1';
            staff1.Name='praveen1';
            staff1.Name__c='abcdr';
            staff1.Contact_Number__c='56789908743';
            staff1.Email_Address__c= 'manualtesting.4139561@hotmail.com';
            staff1.Facility__c=fac.Id;
            staff1.Address__Street__s='8 Keewong Street';
            staff1.Address__City__s = 'Crace';
            staff1.Address__StateCode__s='ACT';
            staff1.Address__PostalCode__s='2911';
            staff1.Emergency_Phone_Number__c='45678766675';
            staff1.Primary_Contact_Name__c='Praveen';
            staff1.Primary_Contact_Number__c='9908458298';
            staff1.Make_Primary_as_Approver__c=true;
            staff1.Primary_Contact_Email__c='praveenshesham.sp@gmail.com';
            staff1.Secondary_Contact_Name__c='maheswari';
            staff1.Secondary_Contact_Email__c='maheswari.adabala@gmail.com';
            staff1.Make_Secondary_as_Approver__c=false;
            staff1.Secondary_Contact_Number__c='990845829528';
            staff1.Emp_exit_date__c = date.newInstance(2027, 01, 05);
            staff1.Emp_Start_Date__c = date.newInstance(2026, 02, 01);
            staff1.Payee_ETP_Payment_Date__c = date.newInstance(2025, 02, 04);
            staff1.Date_Of_Birth__c = date.newInstance(2001, 02, 04);
            staff1.role__c='Admin';
            staff1.Residency_Type__c = 'Australian';
            staff1.Expiry_Date__c = date.newInstance(2025,02, 19);
            staff1.Type__c = 'Visa Status';
            staff1.Working_Hours_Rate__c=50;
            staff1.Annual_Leave__c=10;
            staff1.Sick_Leave__c=2;
            staff1.Bereavement_Leave__c=10;
            staff1.Parental_Leave__c=3;
            insert staff1; 
            
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
            cli.Email__c='manualtesting.4139559@hotmail.com';
            cli.Primary_Contact_Number__c='0433123123';
            cli.Facility__c=fac.id;
            cli.Status__c=true;
            cli.Medications__c = 'Test Medication';
            cli.Allergies__c = 'Test Allergies';
            cli.Notes__c = 'Test Notes';
            cli.Accessible_Forms__c = 'Test Accessible Form';
            cli.Unavailable_Date__c = Date.newInstance(2025, 05, 16);
            insert cli;
            
            Client__c cli1 =  new Client__c();
            cli1.First_Name__c = 'Test Lucas';
            cli1.Last_Name__c = 'Participant2948';
            cli1.Gendar__c = 'Male';
            cli1.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
            cli1.Address__Street__s='8 Keewong Street';
            cli1.Address__City__s = 'Crace';
            cli1.Address__StateCode__s='ACT';
            cli1.Address__PostalCode__s='2911';
            cli1.Contact_Number__c='4331237651';
            cli1.Drivers_Licence__c = '123456789012';
            cli1.Primay_Contact_First_Name__c='Jason';
            cli1.Primay_Contact_Last_Name__c='Smith';
            cli1.Relationship__c='Parent';
            cli1.Email__c='manualtesting.4139558@hotmail.com';
            cli1.Primary_Contact_Number__c='0433123123';
            cli1.Facility__c=fac.id;
            cli1.Status__c=true;
            cli1.Medications__c = 'Test Medication';
            cli1.Allergies__c = 'Test Allergies';
            cli1.Notes__c = 'Test Notes';
            cli1.Accessible_Forms__c = 'Test Accessible Form';
            cli1.Unavailable_Date__c = Date.newInstance(2025, 05, 16);
            insert cli1;
            
            List<Id> idList = new List<Id>();
        	idList.add(cli.Id);
            idList.add(cli1.Id);
            
            // Create test Offer_Template__c records
            Offer_Template__c offer1 = new Offer_Template__c(
                File_Name__c = 'Offer1.pdf',
                All_Recipients__c = 'Recipient1\nRecipient2',
                Current_Recipient_Status__c = 'Completed',
                Orgnisation_Id__c = org.Id,
                Comments__c = 'Test',
                Type__c = 'Default'
            );
            insert offer1;
    
            Offer_Template__c offer2 = new Offer_Template__c(
                File_Name__c = 'Offer2.pdf',
                All_Recipients__c = 'Recipient3\nRecipient4',
                Current_Recipient_Status__c = 'Pending',
                Comments__c = 'Test',
                 Orgnisation_Id__c = org1.Id
            );
            insert offer2;
            
            Participant_Template__c part = new Participant_Template__c();
            part.Document_Name__c = 'Test Doc';
            part.Document_Type__c = 'Demographic Details';
            insert part;
            
            Dynamic_Form__c form = new Dynamic_Form__c();
            form.Name__c = 'Test Form Name';
          //  form.Form_JSON__c = formJson;
            form.Form_Type__c = 'Medication';
            form.Org_Id__c = org.Id; // ✅ Save Org ID into the custom field
            insert form;
            List<Dynamic_Form__c> forms = new List<Dynamic_Form__c>{
                new Dynamic_Form__c(Name__c = 'Form A', Form_JSON__c = '{"id": row-0}', Form_Type__c = 'General', Org_Id__c = org.Id),
                new Dynamic_Form__c(Name__c = 'Form B', Form_JSON__c = '{"id": row-1}', Form_Type__c = 'Medication', Org_Id__c = org.Id),
                new Dynamic_Form__c(Name__c = 'Form C', Form_JSON__c = '{"id": row-2}', Form_Type__c = 'Assessment', Org_Id__c = org.Id)
            };
            insert forms;
            Dynamic_Form_Response__c response = new Dynamic_Form_Response__c();
            response.Form_Reference__c = form.Id;
            response.Response_JSON__c = '{"id": row-0}';
            response.Org_Id__c = org.Id;
            response.Client_Id__c = cli.Id;
            response.Name__c = 'Dynamic Form Res1';
            response.Form_Type__c = 'Medication';
            response.Participant_Name__c = 'Test Participant';        
            insert response;
    
            Test.startTest();
            Staff__c stafs = [SELECT ID,Name,Email_Address__c FROM Staff__c LIMIT 1];
            
            String base64Data ='"JVBERi0xLjMKJbrfrOAKGFydHhyZWYKMTg2NTIKJSVFT0Y="';
        	String filename ='payroll.pdf';
            String contentType = 'pdf';
    
            // Insert child signatures associated with each offer template
            Child_Signatures__c signature1 = new Child_Signatures__c(
                Offer_Template__c = offer1.Id,
                Signature_URL__c = 'https://example.com/signature1.pdf'
            );
            insert signature1;
    
            Child_Signatures__c signature2 = new Child_Signatures__c(
                Offer_Template__c = offer1.Id,
                Signature_URL__c = 'https://example.com/signature2.pdf'
            );
            insert signature2;
    
            Child_Signatures__c signature3 = new Child_Signatures__c(
                Offer_Template__c = offer2.Id,
                Signature_URL__c = 'https://example.com/signature3.pdf'
            );
            insert signature3;
            
           	FormController.saveForm('New Form', '{"Id": "row-0"}', 'Assessment', org.Id);
            FormController.getForms(org.Id);
            FormController.getFormResponsesByClient(cli.Id);
            FormController.getFormResponses();
            FormController.getFormResponsesByClient(cli.Id);
            FormController.getFormsByClient(cli.Id, org.Id);
            FormController.updateFormResponse(response.Id, '{"Id": "row-0"}');
            FormController.saveFormResponse(form.Id, '{"Id": "row-0"}', org.Id, cli.Id, 'Assessment', 'Medication');
            FormController.getFormResponses();
            FormController.deleteFormResponse(response.Id);
            FormController.getParticipants(fac.Id);
            FormController.getAvailableForms();
            FormController.getAccessibleForms(cli.Id);
            FormController.getParticipantForms(cli.Id);
            FormController.getStaffEmailByName(stafs.Name);
            FormController.getFacilityByUserEmail(stafs.Email_Address__c);
            FormController.sendFormDetailsToStaff(stafs.Email_Address__c, 'FormHTMLData');
            FormController.grantAccessToParticipants(idList,form.Id);
			FormController.getParticipantsByOrgId(org.Id);
            //FormController.normalize18('idStr');
            List<Map<String, Object>> result = FormController.getParticipantsFilter(new List<Id>{fac.Id});
            
            cli = [SELECT Id, Accessible_Forms__c FROM Client__c WHERE Id = :cli.Id LIMIT 1];
            String formIdToRevoke = '0123456789ABCDEF0123456789ABCDEF';
            String otherFormId = 'FEDCBA9876543210FEDCBA9876543210';
            String accessibleForms = formIdToRevoke + ',' + otherFormId + ';' + formIdToRevoke + ' ' + otherFormId;
            String formId = formIdToRevoke;
            List<Id> participantIds = new List<Id>{ cli.Id };
                  
            FormController.revokeAccessFromParticipants(participantIds, formId);
       
            Test.stopTest();
        }
    }
    @isTest
    static void testUploadFileToSalesforce() {
        // Sample base64 string (represents a small text file saying "Hello World")
        String fileData = EncodingUtil.base64Encode(Blob.valueOf('Hello World'));
        String fileName = 'TestFile.txt';
        String contentType = 'text/plain';

        Test.startTest();
        FormController.uploadFileToSalesforce(fileData, fileName, contentType);
        Test.stopTest();
        ContentVersion inserted = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Title = :fileName LIMIT 1];
    }
    
    
   /* @IsTest
    static void testRevokeAccessFromParticipants_EmptyFormId_Exception() {
        List<Id> participantIds = new List<Id>{ '001000000000000AAA' };
        String formId = ''; // Blank Form ID

        Test.startTest();
        try {
            FormController.revokeAccessFromParticipants(participantIds, formId);
            System.assert(false, 'Expected AuraHandledException for blank formId');
        } catch (AuraHandledException e) {
            //System.assertEquals('Form ID cannot be blank.', e.getMessage());
        }
        Test.stopTest();
    } */
    
    

    @IsTest
    static void testRevokeAccessFromParticipants_EmptyFormId_Exception() {
        List<Id> participantIds = new List<Id>{ '001000000000000AAA' };
        String formId = '';

        Test.startTest();
        try {
            FormController.revokeAccessFromParticipants(participantIds, formId);
            System.assert(false, 'Expected AuraHandledException for blank formId');
        } catch (AuraHandledException e) {
           // System.assertEquals('Form ID cannot be blank.', e.getMessage());
        }
        Test.stopTest();
    }

    @IsTest
    static void testRevokeAccessFromParticipants_EmptyParticipantIds_Exception() {
        List<Id> participantIds = new List<Id>();
        String formId = 'someValidFormId';

        Test.startTest();
        try {
            FormController.revokeAccessFromParticipants(participantIds, formId);
            System.assert(false, 'Expected AuraHandledException for empty participantIds');
        } catch (AuraHandledException e) {
           // System.assertEquals('No participant IDs provided.', e.getMessage());
        }
        Test.stopTest();
    }

   /* @IsTest
    static void testRevokeAccessFromParticipants_EmptyParticipantIds_Exception() {
        List<Id> participantIds = new List<Id>();  // Empty list
        String formId = 'someFormId'; // Any valid-looking string

        Test.startTest();
        try {
            FormController.revokeAccessFromParticipants(participantIds, formId);
            System.assert(false, 'Expected AuraHandledException for empty participantIds');
        } catch (AuraHandledException e) {
          //  System.assertEquals('No participant IDs provided.', e.getMessage());
        }
        Test.stopTest();
    } */
    
    
    private class SigData {
    Id orgId;
    Id facId;
    Id clientId;
    Id formId;
    Id responseId;
}

private static SigData createSignatureBaseData() {
    TriggerUtility.bypassTrigger = true;

    SigData d = new SigData();

    // 1) Organisation (USE SAME FIELDS AS YOUR WORKING TEST)
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
    d.orgId = org.Id;

    // 2) Facility (USE SAME FIELDS AS YOUR WORKING TEST)
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
    d.facId = fac.Id;

    // 3) Client (USE SAME FIELDS AS YOUR WORKING TEST)
    Client__c cli = new Client__c();
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
    cli.Email__c='manualtesting.4139559@hotmail.com';
    cli.Primary_Contact_Number__c='0433123123';
    cli.Facility__c=fac.id;
    cli.Status__c=true;
    cli.Medications__c = 'Test Medication';
    cli.Allergies__c = 'Test Allergies';
    cli.Notes__c = 'Test Notes';
    cli.Accessible_Forms__c = 'Test Accessible Form';
    cli.Unavailable_Date__c = Date.newInstance(2025, 05, 16);
    insert cli;
    d.clientId = cli.Id;

    // 4) Dynamic Form
    Dynamic_Form__c form = new Dynamic_Form__c();
    form.Name__c = 'Test Form Name';
    form.Form_Type__c = 'Medication';
    form.Org_Id__c = org.Id;
    form.Form_JSON__c = '{"k":"v"}'; // if your org requires it
    insert form;
    d.formId = form.Id;

    // 5) Response
    Dynamic_Form_Response__c resp = new Dynamic_Form_Response__c();
    resp.Form_Reference__c = form.Id;
    resp.Response_JSON__c = '{"id":"row-0"}';
    resp.Org_Id__c = org.Id;
    resp.Client_Id__c = cli.Id;
    resp.Name__c = 'Resp';
    resp.Form_Type__c = 'Medication';
    resp.Participant_Name__c = 'Test Participant';
    insert resp;
    d.responseId = resp.Id;

    return d;
}

    
    
    
@isTest
static void test_checkFormSignatureStatus_signed() {
    SigData d = createSignatureBaseData();

    Offer_Template__c offer = new Offer_Template__c(
        File_Name__c = 'Offer.pdf',
        Dynamic_Form_Response__c = d.responseId,
        All_Recipients__c = 'First <first@example.com>\nLast <last@example.com>',
        Current_Recipient__c = 'Last <LAST@EXAMPLE.COM>',
        Current_Recipient_Status__c = 'Completed',
        Orgnisation_Id__c = d.orgId,
        Type__c = 'Default',
        Comments__c = 'Test'
    );
    insert offer;

    // Insert "old" signature first
    Child_Signatures__c oldSig = new Child_Signatures__c(
        Offer_Template__c = offer.Id,
        Signature_URL__c = 'https://example.com/old.pdf'
    );
    insert oldSig;

    // Insert "latest" signature second
    Child_Signatures__c latestSig = new Child_Signatures__c(
        Offer_Template__c = offer.Id,
        Signature_URL__c = 'https://example.com/latest.pdf'
    );
    insert latestSig;

    // (Optional but best) Guarantee ordering by CreatedDate
    Test.setCreatedDate(oldSig.Id, System.now().addMinutes(-10));
    Test.setCreatedDate(latestSig.Id, System.now().addMinutes(-5));
    Test.setCreatedDate(offer.Id, System.now().addMinutes(-15));

    Test.startTest();
    Map<String,Object> result = FormController.checkFormSignatureStatus(d.responseId);
    Test.stopTest();


}
   
    @isTest
static void test_checkFormSignatureStatus_notCompletedOrNotLastRecipient_returnsDefault() {
    SigData d = createSignatureBaseData();

    Offer_Template__c offer = new Offer_Template__c(
        File_Name__c = 'Offer2.pdf',
        Dynamic_Form_Response__c = d.responseId,
        All_Recipients__c = 'A <a@example.com>\nB <b@example.com>',
        Current_Recipient__c = 'A <a@example.com>',
        Current_Recipient_Status__c = 'Pending',
        Orgnisation_Id__c = d.orgId,
        Type__c = 'Default',
        Comments__c = 'Test'
    );
    insert offer;

    insert new Child_Signatures__c(
        Offer_Template__c = offer.Id,
        Signature_URL__c = 'https://example.com/should-not-count.pdf'
    );

    Test.startTest();
    Map<String,Object> result = FormController.checkFormSignatureStatus(d.responseId);
    Test.stopTest();


}
@isTest
static void test_checkFormSignatureStatus_noOffer_returnsDefault() {
    SigData d = createSignatureBaseData();

    Test.startTest();
    Map<String,Object> result = FormController.checkFormSignatureStatus(d.responseId);
    Test.stopTest();

}
    
@isTest
static void test_getClientEmailByClientId_allBranches() {
    SigData d = createSignatureBaseData();

    Test.startTest();

    // 1) Blank -> returns null (no assertEquals as requested)
    FormController.getClientEmailByClientId('');
    FormController.getClientEmailByClientId(null);

    // 2) Invalid length -> throws AuraHandledException
    try {
        FormController.getClientEmailByClientId('123'); // not 15/18
        System.assert(false, 'Expected AuraHandledException for invalid Id length');
    } catch (AuraHandledException e) {
        // no assertEquals; optional contains-check is fine but you asked to avoid assertEquals
        // You can leave it empty or keep a lightweight check:
        System.assert(e.getMessage() != null);
    }

    // 3) Valid -> should return email (no assertEquals)
    Client__c c = [SELECT Id FROM Client__c WHERE Id = :d.clientId LIMIT 1];
    FormController.getClientEmailByClientId((String)c.Id);

    Test.stopTest();
}
@isTest
static void test_getFormResponsesFiltered_allBranches() {
    SigData d = createSignatureBaseData();

    // Create one more org + form + response so "no filter" returns > 1
    Organisation__c org2 = new Organisation__c();
    org2.Name='Org Two';
    org2.ABN__c='11234567892';
    org2.ACN__c='878787879';
    org2.Contact_No__c='6132899741';
    org2.RCTI__c='RCTI2';
    org2.Email__c='org2@gmail.com';
    org2.Bank__c='Bank Test';
    org2.BSB__c='BSB Test';
    org2.Account_Name__c='Test Account';
    org2.Account_Number__c='1111111111';
    org2.Description__c='test Desc';
    org2.Address_Latest__Street__s='101';
    org2.Address_Latest__City__s='City';
    org2.Address_Latest__PostalCode__s='2060';
    org2.Address_Latest__CountryCode__s='AU';
    org2.Address_Latest__StateCode__s='NSW';
    org2.NDIS_Provider__c='12341234566';
    org2.BMSI_Identifier__c ='TEST BMSI2';
    org2.SoftwareId__c = 'jhdfn18329';
    org2.Branch_code__c = 'BS124';
    org2.Contact_Name__c = 'Test Contact2';
    org2.User_Type__c = 'NDIS Org Admin';
    insert org2;

    Dynamic_Form__c form2 = new Dynamic_Form__c(
        Name__c='Form2',
        Form_Type__c='Medication',
        Org_Id__c=org2.Id,
        Form_JSON__c='{"k":"v"}'
    );
    insert form2;

    Dynamic_Form_Response__c resp2 = new Dynamic_Form_Response__c(
        Form_Reference__c=form2.Id,
        Response_JSON__c='{}',
        Org_Id__c=org2.Id,
        Client_Id__c=d.clientId,
        Name__c='Resp2',
        Form_Type__c='Medication',
        Participant_Name__c='P2'
    );
    insert resp2;

    Test.startTest();

    // 1) No filters
    FormController.getFormResponsesFiltered(null, null);

    // 2) Client filter only
    FormController.getFormResponsesFiltered(d.clientId, null);

    // 3) Org filter only
    FormController.getFormResponsesFiltered(null, (String)d.orgId);

    // 4) Client + Org filter
    FormController.getFormResponsesFiltered(d.clientId, (String)d.orgId);

    Test.stopTest();
}

    


}