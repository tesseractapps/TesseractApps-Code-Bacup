@isTest
public class IncidentRegisterControllerV2_Test {
    
    class MockHttp implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('test');
            return res;
        }
    }
    
    @testSetup
    static void setupData() {
        
        TriggerUtility.bypassTrigger = true;
        
        Organisation__c org = new Organisation__c();
        org.Name='Ashfield Consultants';
        org.ABN__c='12345678901';
        org.ACN__c='878787878';
        org.Contact_No__c='6132899740';
        org.RCTI__c='RCTI1';
        org.Email__c='org@test.com';
        org.Bank__c='Bank Test';
        org.BSB__c='BSB Test';
        org.Account_Name__c='Test Account';
        org.Account_Number__c='1111111111';
        org.Description__c='test Desc';
        org.Address_Latest__Street__s='101';
        org.Address_Latest__City__s='City';
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
        
        Profile prof = [SELECT Id FROM Profile WHERE Name LIKE '%Admin%' LIMIT 1];
        
        String unique = String.valueOf(System.currentTimeMillis());
        
        User user = new User(
            Alias='testu',
            Email='admin'+unique+'@test.com',
            EmailEncodingKey='UTF-8',
            LastName='Test',
            LanguageLocaleKey='en_US',
            LocaleSidKey='en_US',
            ProfileId=prof.Id,
            TimeZoneSidKey='America/New_York',
            UserName='admin'+unique+'@test.com',
            User_Type__c='NDIS Org Admin'
        );
        insert user;
        
        
        System.runAs(user){
            
            Facility__c fac = new Facility__c();
            fac.Name='Ashfield Consultants';
            fac.Address__City__s='Crace';
            fac.Address__Street__s='8 Keewong Street';
            fac.Address__StateCode__s='ACT';
            fac.Address__PostalCode__s='2911';
            fac.Address__CountryCode__s='AU';
            fac.Email__c='fac@test.com';
            fac.Status__c=true;
            fac.Organisation__c=org.Id;
            fac.ABN__c='12345678901';
            fac.Phone__c='12323213';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff';
            staff.Name='staff1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c=user.Email;
            staff.Facility__c=fac.Id;
            staff.Address__Street__s='Street';
            staff.Address__City__s='City';
            staff.Address__StateCode__s='ACT';
            staff.Address__PostalCode__s='2911';
            staff.Emergency_Phone_Number__c='45678766675';
            staff.Primary_Contact_Name__c='Praveen';
            staff.Primary_Contact_Number__c='9908458298';
            staff.Make_Primary_as_Approver__c=true;
            staff.Primary_Contact_Email__c='a@test.com';
            staff.Secondary_Contact_Name__c='b';
            staff.Secondary_Contact_Email__c='b@test.com';
            staff.Make_Secondary_as_Approver__c=false;
            staff.Secondary_Contact_Number__c='99084582958';
            staff.Emp_exit_date__c=date.newInstance(2028,1,5);
            staff.Emp_Start_Date__c=date.newInstance(2023,2,1);
            staff.Payee_ETP_Payment_Date__c=date.newInstance(2025,2,4);
            staff.Date_Of_Birth__c=date.newInstance(2001,2,4);
            staff.role__c='Admin';
            staff.Residency_Type__c='Australian';
            staff.Expiry_Date__c=date.newInstance(2025,2,19);
            staff.Type__c='Visa Status';
            staff.Working_Hours_Rate__c=50;
            staff.Annual_Leave__c=10;
            staff.Sick_Leave__c=2;
            staff.Bereavement_Leave__c=10;
            staff.Parental_Leave__c=3;
            insert staff;
            
            Client__c cli = new Client__c();
            cli.First_Name__c='Test';
            cli.Last_Name__c='Client';
            cli.Gendar__c='Male';
            cli.Date_Of_Birth__c=Date.newInstance(1991,2,17);
            cli.Address__Street__s='Street';
            cli.Address__City__s='City';
            cli.Address__StateCode__s='ACT';
            cli.Address__PostalCode__s='2911';
            cli.Contact_Number__c='4331237651';
            cli.Drivers_Licence__c='123456789012';
            cli.Primay_Contact_First_Name__c='Jason';
            cli.Primay_Contact_Last_Name__c='Smith';
            cli.Relationship__c='Parent';
            cli.Email__c='client@test.com';
            cli.Primary_Contact_Number__c='0433123123';
            cli.Facility__c=fac.id;
            cli.Status__c=true;
            cli.Medications__c='Test';
            cli.Allergies__c='Test';
            cli.Notes__c='Test';
            cli.Accessible_Forms__c='Test';
            cli.Unavailable_Date__c=Date.newInstance(2025,5,16);
            insert cli;
            
            Incident_Form__c form1=new Incident_Form__c(Name__c='Incident Form',Form_JSON__c='{}',
                                                        Form_Type__c='Incident Register',Org_Id__c=org.Id,Status__c='Published');
            insert form1;
            
            Incident_Form__c defaultForm=new Incident_Form__c(Name__c='Default Incident',Form_JSON__c='{}',
                                                              Form_Type__c='Incident Register',Org_Id__c=org.Id,Status__c='Default');
            insert defaultForm;
            
            staff.Accessible_Forms__c=form1.Id;
            update staff;
            
            Incident_Register_Response__c resp=new Incident_Register_Response__c(
                Incident_Form__c=form1.Id,Response_JSON__c='{"bucket":"b","key":"k"}',
                Org_Id__c=org.Id,Client_Id__c=cli.Id,Name__c='Resp',
                Form_Type__c='Incident Register',Status__c='Open',
                Incident_Assigned_Staff__c=staff.Id,History_Log__c='log');
            insert resp;
            
            Incident_Form_Template__c template=new Incident_Form_Template__c();
            insert template;
            
            org.Organization_Logo__c='<img src="/servlet/servlet.FileDownload?file=123">';
            update org;
        }
    }
    
    @isTest
static void runAll_Core() {

    // ----------------------------------
    // Base data (already created by setup/factory)
    // ----------------------------------
    Organisation__c org =
        [SELECT Id, Name FROM Organisation__c LIMIT 1];

    Facility__c fac =
        [SELECT Id FROM Facility__c LIMIT 1];
    Id facId = fac.Id;

    Staff__c staff =
        [SELECT Id, Email_Address__c
         FROM Staff__c
         LIMIT 1];

    Client__c cli =
        [SELECT Id FROM Client__c LIMIT 1];

    Incident_Form__c form =
        [SELECT Id, Name__c FROM Incident_Form__c LIMIT 1];

    Incident_Register_Response__c resp =
        [SELECT Id FROM Incident_Register_Response__c LIMIT 1];

    Incident_Form_Template__c template =
        [SELECT Id FROM Incident_Form_Template__c LIMIT 1];



    // ----------------------------------
    // EXECUTION
    // ----------------------------------
    Test.startTest();

    IncidentRegisterControllerV2.getForms();
    IncidentRegisterControllerV2.getAvailableForms();
     IncidentRegisterControllerV2.getUnreadIncidentRecordIds(staff.Id);
    IncidentRegisterControllerV2.saveIncidentNotificationConfig(org.Id,'{"High":[],"Medium":[],"Low":[]}');

    IncidentRegisterControllerV2.saveFormResponse(
        form.Id,
        '{}',
        org.Id,
        cli.Id,
        'Name',
        'Incident Register',
        'Open',
        staff.Id,
        facId,
        new list<Id>{staff.Id}
    );

    IncidentRegisterControllerV2.getFormResponses(org.Id, facId);
    IncidentRegisterControllerV2.getFormDetailsById(resp.Id);
    IncidentRegisterControllerV2.getPreviousFormData(resp.Id);

    IncidentRegisterControllerV2.updateFormWithHistory(
        resp.Id,
        '{}',
        'log2',
        'Open',
        staff.Id
    );

    IncidentRegisterControllerV2.getFormResponsesByClient(cli.Id);

    IncidentRegisterControllerV2.updateFormResponse(
        resp.Id,
        '{}',
        'Open',
        staff.Id
    );

    IncidentRegisterControllerV2.getStaffRecords(org.Id);
    IncidentRegisterControllerV2.getAccessibleForms(staff.Id);

    IncidentRegisterControllerV2.grantAccessToStaff(
        new List<Id>{ staff.Id },
        new List<String>{ form.Id }
    );

    IncidentRegisterControllerV2.clearGrantedForms(staff.Id);

    IncidentRegisterControllerV2.getOrgLogo(org.Id);

    IncidentRegisterControllerV2.getEmployeeData(
        [SELECT Facility__c FROM Staff__c LIMIT 1].Facility__c
    );

    IncidentRegisterControllerV2.appendFormsToStaff(
        new List<Id>{ staff.Id },
        new List<Id>{ form.Id }
    );

    IncidentRegisterControllerV2.deleteLayout(template.Id);

    IncidentRegisterControllerV2.saveForm(
        'New',
        '{}',
        'Incident Register',
        org.Id
    );

    IncidentRegisterControllerV2.getFormsForUser(
        'NDIS Org Admin',
        staff.Email_Address__c,
        org.Id
    );

    IncidentRegisterControllerV2.getParticipants(
        [SELECT Facility__c FROM Staff__c LIMIT 1].Facility__c
    );

    IncidentRegisterControllerV2.getStaffEmailById(staff.Id);

    IncidentRegisterControllerV2.deleteFormResponse(resp.Id);

    // ⭐ coverage for doesPublishedFormExist
    IncidentRegisterControllerV2.doesPublishedFormExist(
        form.Name__c,
        String.valueOf(org.Id)
    );

    Test.stopTest();
}

    @isTest
    static void runAll_Callout(){
        
        Test.setMock(HttpCalloutMock.class,new MockHttp());
        
        Test.startTest();
        IncidentRegisterControllerV2.fetchImageAsBase64('https://example.com');
        Test.stopTest();
    }
    @isTest
    static void testGetForms_Exception() {
        try {
            IncidentRegisterControllerV2.getForms();
        } catch (Exception e) {}
    }
    
    @isTest
    static void testGetAvailableForms_Exception() {
        try {
            IncidentRegisterControllerV2.getAvailableForms();
        } catch (Exception e) {}
    }
    
    @isTest
    static void testGetFormResponses_NonAdmin() {
        User u = [SELECT Id FROM User WHERE Email LIKE '%admin%' LIMIT 1];
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];        
        Facility__c fac = [SELECT Id FROM Facility__c LIMIT 1];
        Id facId = fac.Id;
        
        Test.startTest();
        System.runAs(u) {
            IncidentRegisterControllerV2.getFormResponses(org.Id,facId);
        }
        Test.stopTest();
    }
    
@isTest
static void testGetFormResponses_NoStaffMatch() {

    TestDataFactory.createBaseData();

    Organisation__c org =
        [SELECT Id FROM Organisation__c LIMIT 1];

    Facility__c fac =
        [SELECT Id, Organisation__c
         FROM Facility__c
         LIMIT 1];

    Staff__c staff =
        [SELECT Id, Email_Address__c, Facility__c
         FROM Staff__c
         WHERE Email_Address__c != null
         LIMIT 1];

    User u = [
        SELECT Id, Organization_Name__c
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    insert new Staff_Facility__c(
        Staff__c = staff.Id,
        Facility__c = fac.Id,
        Active__c = true
    );

    Test.startTest();

    System.runAs(u) {

        IncidentRegisterControllerV2.getFormResponses(
            org.Id,
            fac.Id
        ); 

        IncidentRegisterControllerV2.getStaffsByOrg(
            org.Id,
            fac.Id
        );

        IncidentRegisterControllerV2.sendFormDetailsToStaff(
            'testuser@gmail.com',
            'formDataHtml',
            org.Id,
            'Test Participant',
            'Test Staff1'
        ); // sendIncidentNotificationFromApi
        IncidentRegisterControllerV2.sendIncidentNotificationFromApi(org.Id, staff.Id, 'participantName', 'assignedToName', 'Low', TRUE);
    }

    Test.stopTest();
}
    
    @isTest
    static void testUpdateFormWithHistory_NullValues() {
        Incident_Register_Response__c resp = [SELECT Id FROM Incident_Register_Response__c LIMIT 1];
        
        Test.startTest();
        IncidentRegisterControllerV2.updateFormWithHistory(resp.Id, '{}', 'log', null, null);
        Test.stopTest();
    }
    
    @isTest
    static void testDeleteFormResponse_NoAwsMeta() {
        Incident_Register_Response__c resp = [SELECT Id FROM Incident_Register_Response__c LIMIT 1];
        resp.Response_JSON__c = '{}';
        update resp;
        
        Test.startTest();
        IncidentRegisterControllerV2.deleteFormResponse(resp.Id);
        Test.stopTest();
    }
    
    @isTest
    static void testGetStaffRecords_Exception() {
        Test.startTest();
        try {
            IncidentRegisterControllerV2.getStaffRecords(null);
        } catch (Exception e) {}
        Test.stopTest();
    }
    
    @isTest
    static void testGetAccessibleForms_Empty() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        staff.Accessible_Forms__c = null;
        update staff;
        
        Test.startTest();
        IncidentRegisterControllerV2.getAccessibleForms(staff.Id);
        Test.stopTest();
    }
    
    @isTest
    static void testGrantAccessToStaff_NullForms() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        
        Test.startTest();
        IncidentRegisterControllerV2.grantAccessToStaff(new List<Id>{staff.Id}, null);
        Test.stopTest();
    }
    
    @isTest
    static void testAppendFormsToStaff_EmptyExisting() {
        Staff__c staff = [SELECT Id FROM Staff__c LIMIT 1];
        staff.Accessible_Forms__c = null;
        update staff;
        
        Incident_Form__c form = [SELECT Id FROM Incident_Form__c LIMIT 1];
        
        Test.startTest();
        IncidentRegisterControllerV2.appendFormsToStaff(new List<Id>{staff.Id}, new List<Id>{form.Id});
        Test.stopTest();
    }
    
    @isTest
    static void testGetFormsForUser_RosterManager() {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        Staff__c staff = [SELECT Email_Address__c FROM Staff__c LIMIT 1];
        
        Test.startTest();
        IncidentRegisterControllerV2.getFormsForUser('Roster Manager', staff.Email_Address__c, org.Id);
        Test.stopTest();
    }
    
    @isTest
    static void testGetFormsForUser_StaffWithForms() {
        Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];
        Staff__c staff = [SELECT Email_Address__c FROM Staff__c LIMIT 1];
        
        Test.startTest();
        IncidentRegisterControllerV2.getFormsForUser('Staff', staff.Email_Address__c, org.Id);
        Test.stopTest();
    }
    
    @isTest
    static void testGetFormsForUser_StaffNoEmail() {
        Test.startTest();
        try {
            IncidentRegisterControllerV2.getFormsForUser('Staff', null, null);
        } catch (Exception e) {}
        Test.stopTest();
    }
    
    @isTest
    static void testGetParticipants_Exception() {
        Test.startTest();
        try {
            IncidentRegisterControllerV2.getParticipants(null);
        } catch (Exception e) {}
        Test.stopTest();
    }
    
    @isTest
    static void testGetStaffEmailById_Null() {
        Test.startTest();
        IncidentRegisterControllerV2.getStaffEmailById(null);
        Test.stopTest();
    }
    
    
    @isTest
    static void testFetchImageAsBase64_Exception() {
        Test.setMock(HttpCalloutMock.class, new MockHttp());
        
        Test.startTest();
        try {
            IncidentRegisterControllerV2.fetchImageAsBase64(null);
        } catch (Exception e) {}
        Test.stopTest();
    }
    @isTest
    static void test_deleteFormResponse_AWS_Coverage() {
    
        TestDataFactory.createBaseData();
    
        Organisation__c org =
            [SELECT Id FROM Organisation__c LIMIT 1];
    
        Client__c cli =
            [SELECT Id FROM Client__c LIMIT 1];
    
        // ⭐ CORRECT LOOKUP OBJECT
        Dynamic_Form__c form = new Dynamic_Form__c(
            Name__c = 'AWS Test Form',
            Form_Type__c = 'Incident Register',
            Org_Id__c = org.Id,
            Form_JSON__c = '{}'
        );
        insert form;
    
        // ⭐ AWS metadata JSON (required for coverage)
        String awsJson =
            '{"bucket":"test-bucket","key":"test-file.json"}';
    
        Incident_Register_Response__c resp =
            new Incident_Register_Response__c(
                Form_Reference__c = form.Id,   // ✔ correct type
                Response_JSON__c = awsJson,
                Org_Id__c = org.Id,
                Client_Id__c = cli.Id,
                Name__c = 'AWS Test',
                Form_Type__c = 'Incident Register'
            );
    
        insert resp;
    
        Test.startTest();
    
        IncidentRegisterControllerV2.deleteFormResponse(resp.Id);
    
        Test.stopTest();
    }
    @isTest
    static void testGetFormResponses_AdminBranch() {
    
        TestDataFactory.createBaseData();
    
        User adminUser = [
            SELECT Id
            FROM User
            WHERE User_Type__c = 'NDIS Org Admin' AND IsActive = True
            LIMIT 1
        ];
    
        Organisation__c org =
            [SELECT Id FROM Organisation__c LIMIT 1];
    
        Facility__c fac =
            [SELECT Id FROM Facility__c LIMIT 1];
    
        Test.startTest();
    
        System.runAs(adminUser) {
            IncidentRegisterControllerV2.getFormResponses(
                org.Id,
                fac.Id
            );
        }
    
        Test.stopTest();
    }

    @isTest
    static void testGetFormResponses_StaffBranch_Coverage() {
    
        TestDataFactory.createBaseData();
    
        // existing user from factory
        User u = [
            SELECT Id, User_Type__c, Email
            FROM User
            WHERE IsActive = true AND Email = 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
    
        // 🔥 FORCE NON-ADMIN PATH
        u.User_Type__c = null;
        update u;
    
        Organisation__c org =
            [SELECT Id FROM Organisation__c LIMIT 1];
    
        Facility__c fac =
            [SELECT Id FROM Facility__c LIMIT 1];
    
        Test.startTest();
    
        System.runAs(u) {
            IncidentRegisterControllerV2.getFormResponses(
                org.Id,
                fac.Id
            );
        }
    
        Test.stopTest();
    }

    @isTest
    static void testGetFormResponses_StaffQueryCoverage() {
    
        TestDataFactory.createBaseData();
    
        // existing active user from factory
        User u = [
            SELECT Id, Email, User_Type__c
            FROM User
            WHERE IsActive = true AND Email= 'manualtesting.20294637@hotmail.com'
            LIMIT 1
        ];
    
        // ⭐ FORCE NON-ADMIN PATH
        u.User_Type__c = null;
        update u;
    
        Organisation__c org =
            [SELECT Id FROM Organisation__c LIMIT 1];
    
        Facility__c fac =
            [SELECT Id FROM Facility__c LIMIT 1];
    
        Test.startTest();
    
        System.runAs(u) {
            IncidentRegisterControllerV2.getFormResponses(
                org.Id,
                fac.Id
            );
        }
    
        Test.stopTest();
    }


@isTest
static void testGetFormResponses_Fallback_Coverage() {

    TestDataFactory.createBaseData();

    Organisation__c org =
        [SELECT Id FROM Organisation__c LIMIT 1];

    Facility__c fac =
        [SELECT Id FROM Facility__c LIMIT 1];

    User u = [
        SELECT Id
        FROM User
        WHERE Email = 'manualtesting.20294637@hotmail.com'
        LIMIT 1
    ];

    Test.startTest();

    System.runAs(u) {

        IncidentRegisterControllerV2.getFormResponses(
            org.Id,
            fac.Id
        );

        IncidentRegisterControllerV2.getAdminUsersForOrg(
            org.Id
        );

        IncidentRegisterControllerV2.getIncidentNotificationConfig(
            org.Id
        );

        IncidentRegisterControllerV2.sendFormDetailsToStaffEdit(
            'testuser@gmail.com',
            'formDataHtml',
            org.Id,
            'Test Participant',
            'Test Staff1'
        );  //buildAdminNotificationHtml
        IncidentRegisterControllerV2.buildAdminNotificationHtml(
            'High', 
            'Test Participant', 
            'assignedTo', 
            'reportedBy', 
            'reportedOn', 
            'orgName'
        );
    }

    Test.stopTest();
}

@isTest
static void testSaveFormResponse_NoFacility() {

    Organisation__c org =
        [SELECT Id FROM Organisation__c LIMIT 1];

    Staff__c staff =
        [SELECT Id FROM Staff__c LIMIT 1];

    Client__c cli =
        [SELECT Id FROM Client__c LIMIT 1];

    Incident_Form__c form =
        [SELECT Id FROM Incident_Form__c LIMIT 1];

    Test.startTest();

    try {

        IncidentRegisterControllerV2.saveFormResponse(
            form.Id,
            '{}',
            org.Id,
            cli.Id,
            'Test',
            'Incident Register',
            'Open',
            staff.Id,
            null,
            null
        );

    } catch (Exception e) {}

    Test.stopTest();
}
@isTest
static void testSendFormDetailsToStaffEdit() {

    Organisation__c org =
        [SELECT Id FROM Organisation__c LIMIT 1];

    User u =
        [SELECT Id FROM User LIMIT 1];

    org.IR_Notification_Config__c =
        '{"High":["' + u.Id + '"],"Medium":[],"Low":[]}';

    update org;

    Test.startTest();

    try {

        IncidentRegisterControllerV2.sendFormDetailsToStaffEdit(
            'test@test.com',
            '<table><tr><td>Priority</td><td>High</td></tr></table>',
            org.Id,
            'Participant',
            'Staff'
        );

    } catch (Exception e) {}

    Test.stopTest();
}

@isTest
static void testSendFormDetailsToStaff_AdminCoverage() {

    Organisation__c org =
        [SELECT Id FROM Organisation__c LIMIT 1];

    User u =
        [SELECT Id, Email
         FROM User
         WHERE IsActive = true
         LIMIT 1];

    org.IR_Notification_Config__c =
        '{"High":["' + u.Id + '"],"Medium":[],"Low":[]}';

    update org;

    String html =
        '<table>' +
        '<tr>' +
        '<td>Priority</td>' +
        '<td><span>High</span></td>' +
        '</tr>' +
        '</table>';

    Test.startTest();

    try {

        IncidentRegisterControllerV2.sendFormDetailsToStaff(
            u.Email,
            html,
            org.Id,
            'Test Participant',
            'Test Staff'
        );

    } catch (Exception e) {
        System.debug(e.getMessage());
    }

    Test.stopTest();
}
    
}