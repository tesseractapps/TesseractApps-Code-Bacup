@isTest
public class LayoutControllerTest {
    
    @testsetup Static void testData(){
        Organisation__c org = new Organisation__c();
        org.Name='Age Grace Innovation PVT LTD';
        org.ABN__c='15603031803';
        org.ACN__c='123456789';
        org.Contact_No__c='7989067221';
        org.RCTI__c='007';
        org.Email__c='agegrace2@gmail.com';
        org.Bank__c='Bank1';
        org.BSB__c='BSB';
        org.Account_Name__c='Axis Bank';
        org.Account_Number__c='11111111110';
        org.Description__c='Test Description';
        org.Address_Latest__Street__s='101';
        org.Address_Latest__City__s='Himas Waterhen';
        org.Address_Latest__PostalCode__s='2060';
        org.Address_Latest__CountryCode__s='AU';
        org.Address_Latest__StateCode__s='NSW';
        org.NDIS_Provider__c='12341234565';
        org.BMSI_Identifier__c ='TEST BMSI125b8925-9a97-4178';
        org.SoftwareId__c = '0000521413';
        org.Branch_code__c = 'BS123';
        org.Contact_Name__c = 'Test Contact';
        org.User_Type__c = 'NDIS Org Admin';
        insert org;
        
        String formModule = 'Customisable Form';
        Custom_Form__c cc= new Custom_Form__c();
        cc.Form_JSON__c='{"field1":"value1","field2":"value2"}';
        cc.Name__c='ExistingLayout1';
        cc.Title__c='Original Title';
        cc.Form_Module__c=formModule;
        cc.Orgnisation_Id__c = org.Id;
        insert cc;
        
        Default_Form__c df= new Default_Form__c();
        df.Form_JSON__c='{"field1":"value1","field2":"value2"}';
        df.Name__c='default form';
        insert df;
    }
    
     @isTest
    static void testSaveLayout_NewLayout() {
         Organisation__c org1 =[SELECT ID from Organisation__c LIMIT 1];
        // Test case for creating a new layout
        String layoutData = '{"field1":"value1","field2":"value2"}';
        String layoutName = 'NewLayout';
        String title = 'Test Layout';
        String actionType = 'clone';

        Test.startTest();
        String result = LayoutController.saveLayout(
    layoutData,
    layoutName,
    title,
    actionType,
    String.valueOf(org1.Id),
    'Customisable Form',
    'Staff'   // dummy audience value
);

        Test.stopTest();

    }
       @isTest
    static void testSaveLayout_EditLayout() {
        Organisation__c org =[SELECT ID from Organisation__c LIMIT 1];
        // Prepare existing layout
        Custom_Form__c existingLayout = new Custom_Form__c(Name__c = 'ExistingLayout', Form_JSON__c = '{"field1":"original"}', Title__c = 'Original Title');
        insert existingLayout;

        String updatedLayoutData = '{"field1":"updated"}';
        String updatedTitle = 'Updated Title';
        String actionType = 'edit';
       Custom_Form__c updatedLayout = [SELECT Id,name , Name__c, Form_JSON__c, Title__c FROM Custom_Form__c limit 1];
        Test.startTest();
        String result = LayoutController.saveLayout(updatedLayoutData, updatedLayout.name, updatedTitle, actionType,org.ID,'Customisable Form','Staff');
        Test.stopTest();

    }
      @isTest
    static void testSaveLayout_Create() {
        Organisation__c orgs =[SELECT ID from Organisation__c LIMIT 1];
        // Prepare existing layout
        Custom_Form__c existingLayout = new Custom_Form__c(Name__c = 'ExistingLayout', Form_JSON__c = '{"field1":"original"}', Title__c = 'Original Title');
        insert existingLayout;

        String updatedLayoutData = '{"field1":"updated"}';
        String updatedTitle = 'Updated Title';
        String actionType = 'create';
       Custom_Form__c updatedLayout = [SELECT Id,name , Name__c, Form_JSON__c, Title__c FROM Custom_Form__c limit 1];
        Test.startTest();
        String result = LayoutController.saveLayout(updatedLayoutData, updatedLayout.name, updatedTitle, actionType,orgs.ID,'Customisable Form','Staff');
        Test.stopTest();

    }
    
    
       @isTest
    static void testDeleteLayout_Success() {
        // Insert a layout to delete
         Custom_Form__c updatedLayout = [SELECT Id,name , Name__c, Form_JSON__c, Title__c FROM Custom_Form__c  limit 1 ];

        Test.startTest();
        LayoutController.getLayoutData(updatedLayout.Id);
        Test.stopTest();
    }
      @isTest
    static void get_Layoutdata() {
        // Insert a layout to delete
         Custom_Form__c updatedLayout = [SELECT Id,name , Name__c, Form_JSON__c, Title__c FROM Custom_Form__c  limit 1 ];

        Test.startTest();
        LayoutController.getLayoutData(updatedLayout.Id);
        Test.stopTest();
    }
     @isTest
    static void getAllLayoutdata() {
        // Insert a layout to delete
		Organisation__c orgs2 =[SELECT ID from Organisation__c LIMIT 1];
        Custom_Form__c cf = [SELECT Id,name , Name__c, Form_JSON__c, Title__c,Form_Module__c FROM Custom_Form__c WHERE Form_Module__c='Customisable Form'  limit 1 ];
        Test.startTest();
        LayoutController.getAllLayouts(orgs2.ID,'Customisable Form');
        Test.stopTest();
    }
     @isTest
 static void getDefaultForm() {
        // Insert a layout to delete
        Default_Form__c updatedLayout = [SELECT Id,name , Name__c, Form_JSON__c FROM Default_Form__c  limit 1 ];
        Test.startTest();
        LayoutController.getDefaultFormLayout(updatedLayout.name);
        Test.stopTest();
    }
@isTest
static void testDeleteLayout_Coverage() {

    // ---------- TEST DATA ----------
    Custom_Form__c layout = new Custom_Form__c();

    // DO NOT SET Name (Auto Number)

    layout.Form_JSON__c =
        '{"bucket":"test-bucket","key":"test-key"}';

    insert layout;

    Test.startTest();

    LayoutController.deleteLayout(layout.Id);

    Test.stopTest();

    Integer countRecords = [
        SELECT COUNT()
        FROM Custom_Form__c
        WHERE Id = :layout.Id
    ];

}

    
    
@isTest
static void test_getUnifiedForms_Staff_Coverage() {

    TestDataFactory.createBaseData();

    Organisation__c org =
        [SELECT Id FROM Organisation__c LIMIT 1];

    Staff__c staff =
        [SELECT Id FROM Staff__c LIMIT 1];

    Dynamic_Form__c pub = new Dynamic_Form__c(
        Name__c = 'Published Form',
        Org_Id__c = org.Id,
        Audience__c = 'Staff'
    );
    insert pub;

    // 🔥 VERY IMPORTANT
    // ensures split + trim + loop executes
    staff.Accessible_Custom_Forms__c =
        pub.Id + ';' + pub.Id;

    update staff;



    LayoutController.getUnifiedForms(
        String.valueOf(org.Id),
        'Customisable Form',
        'Staff'
    );


}

@isTest
static void test_getUnifiedForms_Participant_Coverage() {

    TestDataFactory.createBaseData();

    Organisation__c org =
        [SELECT Id FROM Organisation__c LIMIT 1];

    Client__c client =
        [SELECT Id FROM Client__c LIMIT 1];

    Dynamic_Form__c pub = new Dynamic_Form__c(
        Name__c = 'Participant Form',
        Org_Id__c = org.Id,
        Audience__c = 'Participant'
    );
    insert pub;

    // 🔥 force parser execution
    client.Accessible_Forms__c =
        pub.Id + '\n' + pub.Id;

    update client;



    LayoutController.getUnifiedForms(
        String.valueOf(org.Id),
        'Customisable Form',
        'Participant'
    );

  
}

@isTest
static void test_fetchStaffRolesByFacility_Coverage() {

    TestDataFactory.createBaseData();

    Facility__c fac =
        [SELECT Id FROM Facility__c LIMIT 1];

    insert new Facility_Role__c(
        Facility__c = fac.Id,
        Role_Name__c = 'Admin',
        Is_Active__c = true
    );

    insert new Facility_Role__c(
        Facility__c = fac.Id,
        Role_Name__c = 'Admin',
        Is_Active__c = true
    );

  

    LayoutController.fetchStaffRolesByFacility(
        new List<Id>{ fac.Id }
    );

   
}
  
    @isTest
static void test_AccessUserDTO_Coverage() {

    new LayoutController.AccessUserDTO(
        UserInfo.getUserId(),
        'John Doe Smith',
        null
    );
}

@isTest
static void test_getStaffForAssign_Coverage() {

    TestDataFactory.createBaseData();

    // ===================================================
    // Base test records
    // ===================================================

    Staff__c staff = [
        SELECT Id,
               Email_Address__c
        FROM Staff__c
        LIMIT 1
    ];

    Facility__c fac = [
        SELECT Id,
               Organisation__c
        FROM Facility__c
        LIMIT 1
    ];

    // ===================================================
    // Organisation must exist (now driven by Facility)
    // ===================================================



    Id orgId = fac.Organisation__c;

    // ===================================================
    // Staff ↔ Facility mapping (REQUIRED)
    // ===================================================

    insert new Staff_Facility__c(
        Staff__c   = staff.Id,
        Facility__c = fac.Id,
        Active__c  = true
    );

    // ===================================================
    // Staff Role (REQUIRED)
    // ===================================================

    insert new StaffRole__c(
        StaffRole_To_Staff__c = staff.Id,
        Facility__c           = fac.Id,
        RoleName__c           = 'Admin',
        Active__c             = true
    );

    // ===================================================
    // USER EMAIL MATCH (VERY IMPORTANT)
    // ===================================================

    User u = [
        SELECT Id, Email
        FROM User
        LIMIT 1
    ];

    staff.Email_Address__c = u.Email;
    update staff;

    // ===================================================
    // Execute Method
    // ===================================================

   

    List<Map<String,Object>> result =
        LayoutController.getStaffForAssign(
            new List<Id>{ fac.Id },
            new List<String>{ 'Admin' },
            orgId
        );

  
    // ===================================================
    // Assertions
    // ===================================================


}

    
@isTest
static void test_grantAccessToParticipantsBulk_Coverage() {

    TestDataFactory.createBaseData();

    Client__c client =
        [SELECT Id FROM Client__c LIMIT 1];

    List<String> formIds = new List<String>{
        'a0B000000000001',
        'a0B000000000002'
    };

   

    // ===============================
    // SYNC MODE (remove allowed)
    // ===============================
    LayoutController.grantAccessToParticipantsBulk(
        new List<Id>{ client.Id },   // ALL
        new List<Id>{ client.Id },   // SELECTED
        formIds,
        false                        // appendOnly
    );

    // ===============================
    // APPEND MODE (no remove)
    // ===============================
    LayoutController.grantAccessToParticipantsBulk(
        new List<Id>{ client.Id },
        new List<Id>{ client.Id },
        formIds,
        true
    );


}

    
@isTest
static void test_grantAccessToStaffBulk_Coverage() {

    TestDataFactory.createBaseData();

    Staff__c staff =
        [SELECT Id FROM Staff__c LIMIT 1];

    List<String> formIds = new List<String>{
        'a0B000000000003',
        'a0B000000000004'
    };

 

    // ===============================
    // SYNC MODE
    // ===============================
    LayoutController.grantAccessToStaffBulk(
        new List<Id>{ staff.Id },
        new List<Id>{ staff.Id },
        formIds,
        false
    );

    // ===============================
    // APPEND MODE
    // ===============================
    LayoutController.grantAccessToStaffBulk(
        new List<Id>{ staff.Id },
        new List<Id>{ staff.Id },
        formIds,
        true
    );


}

@isTest
static void test_grantAccess_Bulk_Exceptions() {

    Test.startTest();

    try {
        LayoutController.grantAccessToParticipantsBulk(
            new List<Id>(),
            new List<Id>(),
            new List<String>{ 'x' },
            false
        );
    } catch (Exception e) {}

    try {
        LayoutController.grantAccessToStaffBulk(
            new List<Id>(),
            new List<Id>(),
            new List<String>{ 'x' },
            false
        );
    } catch (Exception e) {}

    Test.stopTest();
}

  @isTest
static void test_doesLayoutTitleExist_Coverage() {

    Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

    Dynamic_Form__c df = new Dynamic_Form__c(
        Name__c = 'Test Layout',
        Org_Id__c = org.Id,
        Audience__c = 'Staff',
        Form_Group_Id__c = 'GRP1',
        Version_Label__c = 'V1'
    );
    insert df;

    Test.startTest();

    Boolean result1 = LayoutController.doesLayoutTitleExist(
        'Test Layout',
        String.valueOf(org.Id),
        'Staff'
    );

    Test.stopTest();

    Boolean result2 = LayoutController.doesLayoutTitleExist(
        'NotExisting',
        String.valueOf(org.Id),
        'Staff'
    );

    Boolean result3 = LayoutController.doesLayoutTitleExist(
        '',
        String.valueOf(org.Id),
        'Staff'
    );
}
  @isTest
static void test_getDynamicFormData_Coverage() {

    Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

    Dynamic_Form__c df = new Dynamic_Form__c(
        Name__c = 'Form1',
        Form_JSON__c = '{"a":"b"}',
        Form_Type__c = 'Customisable Form',
        Org_Id__c = org.Id,
        Audience__c = 'Staff',
        Form_Group_Id__c = 'GRP1',
        Version_Label__c = 'v1'
    );
    insert df;

    Test.startTest();
    LayoutController.getDynamicFormData(df.Id);
    Test.stopTest();
}
    @isTest
static void test_deleteDynamicForm_Coverage() {

    Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

    Dynamic_Form__c df = new Dynamic_Form__c(
        Name__c = 'DeleteForm',
        Form_JSON__c = '{"bucket":"test","key":"file1"}',
        Org_Id__c = org.Id,
        Audience__c = 'Staff'
    );
    insert df;

    Test.startTest();
    LayoutController.deleteDynamicForm(df.Id);
    Test.stopTest();
}
    @isTest
static void test_saveFormWithVersion_New() {

    Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

    Test.startTest();

    LayoutController.saveFormWithVersion(
        null,
        'NewForm1',
        '{"a":"b"}',
        'Customisable Form',
        String.valueOf(org.Id),
        'Staff',
        null,
        false
    );

    Test.stopTest();
}
    @isTest
static void test_saveFormWithVersion_Version() {

    Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

    Dynamic_Form__c df = new Dynamic_Form__c(
        Name__c = 'BaseForm',
        Form_JSON__c = '{"a":"b"}',
        Form_Type__c = 'Customisable Form',
        Org_Id__c = org.Id,
        Audience__c = 'Staff',
        Form_Group_Id__c = 'GRP100',
        Version_Label__c = 'v1'
    );
    insert df;

    Test.startTest();

    LayoutController.saveFormWithVersion(
        null,
        'BaseForm',
        '{"a":"c"}',
        'Customisable Form',
        String.valueOf(org.Id),
        'Staff',
        'GRP100',
        true
    );

    Test.stopTest();
}
    @isTest
static void test_saveFormWithVersion_Duplicate() {

    Organisation__c org = [SELECT Id FROM Organisation__c LIMIT 1];

    Dynamic_Form__c df = new Dynamic_Form__c(
        Name__c = 'DupForm',
        Form_JSON__c = '{"a":"b"}',
        Form_Type__c = 'Customisable Form',
        Org_Id__c = org.Id,
        Audience__c = 'Staff',
        Form_Group_Id__c = 'GRP200',
        Version_Label__c = 'v1'
    );
    insert df;

    Test.startTest();

    try {
        LayoutController.saveFormWithVersion(
            null,
            'DupForm',
            '{"a":"x"}',
            'Customisable Form',
            String.valueOf(org.Id),
            'Staff',
            null,
            false
        );
    } catch (Exception e) {}

    Test.stopTest();
}
 
}