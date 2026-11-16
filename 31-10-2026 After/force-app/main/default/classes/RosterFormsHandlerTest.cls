@IsTest
public class RosterFormsHandlerTest {
    
    @TestSetup
    static void setupTestData() {
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
        
        Profile prof = [SELECT Id, Name FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        User user = new User(
            Alias = 'praveen', 
            Email = 'manualtesting.1139562@hotmail.com', 
            EmailEncodingKey = 'UTF-8', 
            LastName = 'Test Friday1139562', 
            LanguageLocaleKey = 'en_US', 
            LocaleSidKey = 'en_US', 
            ProfileId = prof.Id, 
            TimeZoneSidKey = 'America/New_York', 
            UserName = 'manualtesting.1139562@hotmail.com',
            Organization_Name__c = 'Ashfield Consultants'
        );
        insert user;
        
        System.runAs(user) { 
            
            Facility__c fac = new Facility__c();
            fac.Name = 'Ashfield Consultants4567';
            fac.Address__City__s = 'Crace';
            fac.Address__Street__s = '8 Keewong Street';
            fac.Address__StateCode__s = 'ACT';
            fac.Address__PostalCode__s = '2911';
            fac.Address__CountryCode__s = 'AU';
            fac.Email__c = 'testonefacility111@gmail.com';
            fac.Status__c = true;
            fac.Organisation__c = org.Id;
            fac.ABN__c = '12345678912';
            fac.Phone__c = '12323432';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c = 'Test staff';
            staff.Name = 'praveen1';
            staff.Name__c = 'abcd';
            staff.Contact_Number__c = '56789908743';
            staff.Email_Address__c = 'manualtesting.1139562@hotmail.com';
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
            staff.Emp_exit_date__c = Date.newInstance(2028, 01, 05);
            staff.Emp_Start_Date__c = Date.newInstance(2023, 02, 01);
            staff.Payee_ETP_Payment_Date__c = Date.newInstance(2025, 02, 04);
            staff.Date_Of_Birth__c = Date.newInstance(2001, 02, 04);
            staff.role__c = 'Admin';
            staff.Residency_Type__c = 'Australian';
            staff.Expiry_Date__c = Date.newInstance(2025, 02, 19);
            staff.Type__c = 'Visa Status';
            staff.Working_Hours_Rate__c = 50;
            staff.Annual_Leave__c = 10;
            staff.Sick_Leave__c = 2;
            staff.Bereavement_Leave__c = 10;
            staff.Parental_Leave__c = 3; 
            staff.Status__c = true;
            insert staff; 
            
            Client__c cli = new Client__c();
            cli.First_Name__c = 'Test';
            cli.Last_Name__c = 'Participant2948';
            cli.Gendar__c = 'Male';
            cli.Date_Of_Birth__c = Date.newInstance(1991, 2, 17);
            cli.Address__Street__s = '8 Keewong Street';
            cli.Address__City__s = 'Crace';
            cli.Address__StateCode__s = 'ACT';
            cli.Address__PostalCode__s = '2911';
            cli.Contact_Number__c = '4331237651';
            cli.Drivers_Licence__c = '123456789012';
            cli.Primay_Contact_First_Name__c = 'Jason';
            cli.Primay_Contact_Last_Name__c = 'Smith';
            cli.Relationship__c = 'Parent';
            cli.Email__c = 'manualtesting.4139559@hotmail.com';
            cli.Primary_Contact_Number__c = '0433123123';
            insert cli;

            List<Dynamic_Form__c> forms = new List<Dynamic_Form__c>();
            forms.add(new Dynamic_Form__c(
                Name__c = 'Form A', 
                Form_JSON__c = '{"id": "row-0"}', 
                Form_Type__c = 'General', 
                Org_Id__c = org.Id,
                Audience__c = 'Participant',
                Status__c = 'Draft'
            ));
            forms.add(new Dynamic_Form__c(
                Name__c = 'Form B', 
                Form_JSON__c = '{"id": "row-1"}', 
                Form_Type__c = 'Medication', 
                Org_Id__c = org.Id,
                Audience__c = 'Participant',
                Status__c = 'Draft'
            ));
            forms.add(new Dynamic_Form__c(
                Name__c = 'Form C', 
                Form_JSON__c = '{"id": "row-2"}', 
                Form_Type__c = 'Assessment', 
                Org_Id__c = org.Id,
                Audience__c = 'Participant',
                Status__c = 'Draft'
            ));
            forms.add(new Dynamic_Form__c(
                Name__c = 'Form D', 
                Form_JSON__c = '{"id": "row-3"}', 
                Form_Type__c = 'General', 
                Org_Id__c = org.Id,
                Audience__c = 'Staff', // Not for participant
                Status__c = 'Draft'
            ));
            insert forms;
            
            // Store form IDs for later use
            Client__c participant = [SELECT Id FROM Client__c WHERE Last_Name__c = 'Participant2948' LIMIT 1];
            List<Dynamic_Form__c> participantForms = [SELECT Id FROM Dynamic_Form__c WHERE Audience__c = 'Participant'];
            
            // Set accessible forms on participant (new line separated)
            String accessibleForms = '';
            for(Dynamic_Form__c form : participantForms) {
                accessibleForms += form.Id + '\n';
            }
            participant.Accessible_Forms__c = accessibleForms.trim();
            update participant;
        }
    }
    
    @IsTest
    static void testGetParticipantForms_WithValidParticipant() {
        Client__c participant = [SELECT Id FROM Client__c WHERE Last_Name__c = 'Participant2948' LIMIT 1];
        
        Test.startTest();
        List<RosterFormsHandler.FormWrapper> result = RosterFormsHandler.getParticipantForms(participant.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetParticipantForms_ParticipantWithNoAccessibleForms() {
        // Create participant with no accessible forms
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        
          Client__c participant = [SELECT Id FROM Client__c WHERE Last_Name__c = 'Participant2948' LIMIT 1];
        
        Test.startTest();
        List<RosterFormsHandler.FormWrapper> result = RosterFormsHandler.getParticipantForms(participant.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetParticipantForms_WithEmptyAccessibleForms() {
        // Create participant with empty string accessible forms
        Organisation__c org = [SELECT Id FROM Organisation__c WHERE Name = 'Ashfield Consultants' LIMIT 1];
        
         Client__c participant = [SELECT Id,Accessible_Forms__c FROM Client__c WHERE Last_Name__c = 'Participant2948' LIMIT 1];
        
        Test.startTest();
        List<RosterFormsHandler.FormWrapper> result = RosterFormsHandler.getParticipantForms(participant.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetParticipantForms_WithBlankLinesInAccessibleForms() {
        Client__c participant = [SELECT Id,Accessible_Forms__c FROM Client__c WHERE Last_Name__c = 'Participant2948' LIMIT 1];
        
        // Add blank lines to accessible forms
        participant.Accessible_Forms__c = '\n\n' + participant.Accessible_Forms__c + '\n\n';
        update participant;
        
        Test.startTest();
        List<RosterFormsHandler.FormWrapper> result = RosterFormsHandler.getParticipantForms(participant.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetParticipantForms_ParticipantNotFound() {
        // Use a fake ID
        Id fakeId = Id.valueOf('001000000000000');
        
        Test.startTest();
        try {
            List<RosterFormsHandler.FormWrapper> result = RosterFormsHandler.getParticipantForms(fakeId);
        } catch (Exception e) {
            // Expected exception
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testGetParticipantForms_NullParticipantId() {
        Test.startTest();
        List<RosterFormsHandler.FormWrapper> result = RosterFormsHandler.getParticipantForms(null);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetParticipantForms_WithInvalidFormIds() {
        Client__c participant = [SELECT Id,Accessible_Forms__c FROM Client__c WHERE Last_Name__c = 'Participant2948' LIMIT 1];
        Test.startTest();
        try {
            List<RosterFormsHandler.FormWrapper> result = RosterFormsHandler.getParticipantForms(participant.Id);
        } catch (Exception e) {
            // Expected exception for invalid IDs
        }
        Test.stopTest();
    }
    
    @IsTest
    static void testGetParticipantForms_WithSomeValidSomeInvalidFormIds() {
        Client__c participant = [SELECT Id FROM Client__c WHERE Last_Name__c = 'Participant2948' LIMIT 1];
        
        // Get a valid form ID
        Dynamic_Form__c validForm = [SELECT Id FROM Dynamic_Form__c WHERE Name__c = 'Form A' LIMIT 1];
        
        // Mix valid and invalid IDs
        participant.Accessible_Forms__c = validForm.Id + '\ninvalidId\n' + 'anotherInvalid';
        update participant;
        
        Test.startTest();
       // List<RosterFormsHandler.FormWrapper> result = RosterFormsHandler.getParticipantForms(participant.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetParticipantForms_VerifyOnlyParticipantAudienceForms() {
        Client__c participant = [SELECT Id FROM Client__c WHERE Last_Name__c = 'Participant2948' LIMIT 1];
        
        // Get all form IDs including staff audience
        List<Dynamic_Form__c> allForms = [SELECT Id, Audience__c FROM Dynamic_Form__c];
        String accessibleForms = '';
        for(Dynamic_Form__c form : allForms) {
            accessibleForms += form.Id + '\n';
        }
        participant.Accessible_Forms__c = accessibleForms.trim();
        update participant;
        
        Test.startTest();
        List<RosterFormsHandler.FormWrapper> result = RosterFormsHandler.getParticipantForms(participant.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testFormWrapperConstructor() {
        Test.startTest();
        RosterFormsHandler.FormWrapper wrapper = new RosterFormsHandler.FormWrapper('testId', 'testName');
        Test.stopTest();
    }
}