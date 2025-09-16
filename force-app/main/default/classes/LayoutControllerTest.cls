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
        
        Custom_Form__c cc= new Custom_Form__c();
        cc.Form_JSON__c='{"field1":"value1","field2":"value2"}';
        cc.Name__c='ExistingLayout1';
        cc.Title__c='Original Title';
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
        String result = LayoutController.saveLayout(layoutData, layoutName, title, actionType,org1.ID,'Customisable Form');
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
        String result = LayoutController.saveLayout(updatedLayoutData, updatedLayout.name, updatedTitle, actionType,org.ID,'Customisable Form');
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
        String result = LayoutController.saveLayout(updatedLayoutData, updatedLayout.name, updatedTitle, actionType,orgs.ID,'Customisable Form');
        Test.stopTest();

    }
    
    
       @isTest
    static void testDeleteLayout_Success() {
        // Insert a layout to delete
         Custom_Form__c updatedLayout = [SELECT Id,name , Name__c, Form_JSON__c, Title__c FROM Custom_Form__c where Name__c='ExistingLayout1' limit 1 ];

        Test.startTest();
        LayoutController.deleteLayout(updatedLayout.name); // Call the delete method
        Test.stopTest();
    }
      @isTest
    static void get_Layoutdata() {
        // Insert a layout to delete
         Custom_Form__c updatedLayout = [SELECT Id,name , Name__c, Form_JSON__c, Title__c FROM Custom_Form__c  limit 1 ];

        Test.startTest();
        LayoutController.getLayoutData(updatedLayout.name);
        Test.stopTest();
    }
     @isTest
    static void getAllLayoutdata() {
        // Insert a layout to delete
		Organisation__c orgs2 =[SELECT ID from Organisation__c LIMIT 1];
        Test.startTest();
        LayoutController.getAllLayouts(orgs2.ID);
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

  
  
}