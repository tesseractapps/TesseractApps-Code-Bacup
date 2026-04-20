@IsTest
public class LayoutIncidentControllerTest {
    
    @testsetup 
    Static void testData(){
          List<String> picklistRoles = new List<String>();
       // for (Schema.PicklistEntry pe : Organisation__c.Roles__c.getDescribe().getPicklistValues()) {
         //   picklistRoles.add(pe.getValue());
       // }
        
        // If picklist is empty (sandbox fallback)
        if (picklistRoles.isEmpty()) {
            picklistRoles.addAll(new List<String>{'Admin', 'AIN'});
        }
        
        // Select first 2 valid roles safely
        String role1 = picklistRoles[0];
        String role2 = picklistRoles.size() > 1 ? picklistRoles[1] : role1;
        
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
          org.Roles__c = role1 + ';' + role2;
        insert org;
        
        //system.debug(org.name);
        Profile prof = [select id,Name from profile where name LIKE '%Admin%'];
        User user = new User(Alias = 'praveen', Email= 'manualtesting.20294637@hotmail.com', 
                             EmailEncodingKey='UTF-8', LastName='StaffOne209463', LanguageLocaleKey='en_US', 
                             LocaleSidKey='en_US', ProfileId = prof.Id, TimeZoneSidKey='America/New_York', 
                             User_Type__c='NDIS Org Admin', UserName='manualtesting.20294637@hotmail.com',Organization_Name__c ='Ashfield Consultants');
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
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            fac.ABN__c='12234567';
            fac.Phone__c = '12323432';
            fac.Type_of_Service__c='Ndis';
            insert fac;
            
            Staff__c staff = new Staff__c();
            staff.Last_Name__c='Test staff'; 
            staff.Name='praveen1';
            staff.Name__c='abcd';
            staff.Contact_Number__c='56789908743';
            staff.Email_Address__c= 'manualtesting.20294637@hotmail.com';
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
            staff.Status__c = true;
            
           // staff.Role__c = 'Support Worker';
            insert staff; 
        }
    }

    // =====================================================
    // BASE DATA
    // =====================================================

   /* @testSetup
    static void testData() {
        TestDataFactory.createBaseData();
    } */

    // =====================================================
    // SAVE — CREATE
    // =====================================================

    @IsTest
    static void testSaveCreate() {

        Organisation__c org =
            [SELECT Id FROM Organisation__c LIMIT 1];

        Test.startTest();

        String result =
            LayoutIncidentController.saveLayout(
                '{"a":1}',
                'Incident Layout A',
                'Incident Title',
                'create',
                org.Id,
                'Incident Register'
            );

        Test.stopTest();

        System.assert(result != null);
    }

    // =====================================================
    // SAVE — EDIT
    // =====================================================

    @IsTest
    static void testSaveEdit() {

        Organisation__c org =
            [SELECT Id FROM Organisation__c LIMIT 1];

        Incident_Form_Template__c t =
            new Incident_Form_Template__c(
                Name__c = 'EditLayout_' + System.currentTimeMillis(),
                Title__c = 'Old',
                Form_JSON__c = '{}',
                Orgnisation_Id__c = org.Id,
                Form_Module__c = 'Incident Register'
            );
        insert t;

        t = [
            SELECT Id, Name
            FROM Incident_Form_Template__c
            WHERE Id = :t.Id
        ];

        Test.startTest();

        LayoutIncidentController.saveLayout(
            '{"b":2}',
            t.Name,
            'New Title',
            'edit',
            org.Id,
            'Incident Register'
        );

        Test.stopTest();

        Incident_Form_Template__c updated =
            [SELECT Id
             FROM Incident_Form_Template__c
             WHERE Id = :t.Id];

        System.assert(updated != null);
    }

    // =====================================================
    // DELETE
    // =====================================================

    @IsTest
    static void testDeleteLayout() {

        Organisation__c org =
            [SELECT Id FROM Organisation__c LIMIT 1];

        Incident_Form_Template__c t =
            new Incident_Form_Template__c(
                Name__c = 'DeleteLayout_' + System.currentTimeMillis(),
                Title__c = 'Draft',
                Form_JSON__c = '{"bucket":"b","key":"k"}',
                Orgnisation_Id__c = org.Id,
                Form_Module__c = 'Incident Register'
            );
        insert t;

        Test.startTest();
        LayoutIncidentController.deleteLayout(t.Id);
        Test.stopTest();

        Integer cnt =
            [SELECT COUNT()
             FROM Incident_Form_Template__c
             WHERE Id = :t.Id];

        System.assert(cnt == 0);
    }

    // =====================================================
    // GET BY NAME
    // =====================================================

    @IsTest
    static void testGetLayoutData() {

        Organisation__c org =
            [SELECT Id FROM Organisation__c LIMIT 1];

        Incident_Form_Template__c t =
            new Incident_Form_Template__c(
                Name__c = 'FetchByName_' + System.currentTimeMillis(),
                Title__c = 'Fetch',
                Form_JSON__c = '{}',
                Orgnisation_Id__c = org.Id,
                Form_Module__c = 'Incident Register'
            );
        insert t;

        t = [
            SELECT Id, Name
            FROM Incident_Form_Template__c
            WHERE Id = :t.Id
        ];

        Test.startTest();

        LayoutIncidentController.LayoutWrapper w =
            LayoutIncidentController.getLayoutData(
                t.Name
            );

        Test.stopTest();

        System.assert(w != null);
        System.assert(w.layoutName != null);
    }

    // =====================================================
    // GET BY ID
    // =====================================================

    @IsTest
    static void testGetLayoutDataById() {

        Organisation__c org =
            [SELECT Id FROM Organisation__c LIMIT 1];

        Incident_Form_Template__c t =
            new Incident_Form_Template__c(
                Name__c = 'FetchById_' + System.currentTimeMillis(),
                Title__c = 'Fetch',
                Form_JSON__c = '{}',
                Orgnisation_Id__c = org.Id,
                Form_Module__c = 'Incident Register'
            );
        insert t;

        Test.startTest();

        LayoutIncidentController.LayoutWrapper w =
            LayoutIncidentController.getLayoutDataById(
                t.Id
            );

        Test.stopTest();

        System.assert(w != null);
        System.assert(w.layoutName != null);
    }

    // =====================================================
    // GET ALL
    // =====================================================

@IsTest
static void testGetAllLayouts() {

    Organisation__c org =
        [SELECT Id FROM Organisation__c LIMIT 1];

    // 🔵 Custom Layout — hits FIRST loop
    insert new Incident_Form_Template__c(
        Name__c = 'CoverAll_' + System.currentTimeMillis(),
        Title__c = 'Cover All',
        Form_JSON__c = '{}',
        Orgnisation_Id__c = org.Id,
        Form_Module__c = 'Incident Register'
    );

    // 🟢 Default layout — hits SECOND loop
    insert new Default_Form__c(
        Name__c = 'DefaultCover_' + System.currentTimeMillis(),
        Form_JSON__c = '{}',
        Form_Module__c = 'Customisable Form'
    );

    Test.startTest();

    Map<String,
        List<LayoutIncidentController.LayoutWrapper>> res =
            LayoutIncidentController.getAllLayouts(
                org.Id,
                'Incident Register'
            );

    Test.stopTest();

    System.assert(res != null);
    System.assert(res.get('CustomLayouts').size() > 0);
    System.assert(res.get('DefaultLayouts').size() > 0);
}


    // =====================================================
    // DEFAULT FORM
    // =====================================================

    @IsTest
    static void testDefaultFormLayout() {

        Default_Form__c df =
            new Default_Form__c(
                Name__c = 'Incident Default ' +
                    System.currentTimeMillis(),
                Form_JSON__c = '{}',
                Form_Module__c = 'Customisable Form'
            );
        insert df;

        df = [
            SELECT Name
            FROM Default_Form__c
            WHERE Id = :df.Id
        ];

        Test.startTest();

        Map<String, String> m =
            LayoutIncidentController.getDefaultFormLayout(
                df.Name
            );

        Test.stopTest();

        System.assert(m != null);
        System.assert(m.containsKey('Form_JSON__c'));
    }

    // =====================================================
    // UNIFIED FORMS
    // =====================================================

    @IsTest
    static void testUnifiedForms() {

        Organisation__c org =
            [SELECT Id FROM Organisation__c LIMIT 1];

        insert new Incident_Form_Template__c(
            Name__c = 'DraftUnified_' +
                System.currentTimeMillis(),
            Title__c = 'Draft',
            Form_JSON__c = '{}',
            Orgnisation_Id__c = org.Id,
            Form_Module__c = 'Incident Register'
        );

        Incident_Form__c pub =
            new Incident_Form__c(
                Name__c = 'Published Incident',
                Form_Type__c = 'Incident Register',
                Status__c = 'Published'
            );
        insert pub;

        insert new Incident_Form__c(
            Name__c = 'Default Incident',
            Form_Type__c = 'Incident Register',
            Status__c = 'Default'
        );

        Staff__c staff =
            [SELECT Id FROM Staff__c LIMIT 1];

        staff.Accessible_Forms__c = pub.Id;
        update staff;

        Test.startTest();

        List<LayoutIncidentController.UnifiedFormWrapper>
            listRes =
                LayoutIncidentController.getUnifiedForms();

        Test.stopTest();

        System.assert(listRes != null);
        System.assert(listRes.size() > 0);
    }
    

}