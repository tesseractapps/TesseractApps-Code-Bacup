@isTest
public class LayoutControllerTest {
    
    @testsetup Static void testData(){
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
        // Test case for creating a new layout
        String layoutData = '{"field1":"value1","field2":"value2"}';
        String layoutName = 'NewLayout';
        String title = 'Test Layout';
        String actionType = 'clone';

        Test.startTest();
        String result = LayoutController.saveLayout(layoutData, layoutName, title, actionType);
        Test.stopTest();

    }
       @isTest
    static void testSaveLayout_EditLayout() {
        // Prepare existing layout
        Custom_Form__c existingLayout = new Custom_Form__c(Name__c = 'ExistingLayout', Form_JSON__c = '{"field1":"original"}', Title__c = 'Original Title');
        insert existingLayout;

        String updatedLayoutData = '{"field1":"updated"}';
        String updatedTitle = 'Updated Title';
        String actionType = 'edit';
       Custom_Form__c updatedLayout = [SELECT Id,name , Name__c, Form_JSON__c, Title__c FROM Custom_Form__c limit 1];
        Test.startTest();
        String result = LayoutController.saveLayout(updatedLayoutData, updatedLayout.name, updatedTitle, actionType);
        Test.stopTest();

    }
      @isTest
    static void testSaveLayout_Create() {
        // Prepare existing layout
        Custom_Form__c existingLayout = new Custom_Form__c(Name__c = 'ExistingLayout', Form_JSON__c = '{"field1":"original"}', Title__c = 'Original Title');
        insert existingLayout;

        String updatedLayoutData = '{"field1":"updated"}';
        String updatedTitle = 'Updated Title';
        String actionType = 'create';
       Custom_Form__c updatedLayout = [SELECT Id,name , Name__c, Form_JSON__c, Title__c FROM Custom_Form__c limit 1];
        Test.startTest();
        String result = LayoutController.saveLayout(updatedLayoutData, updatedLayout.name, updatedTitle, actionType);
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

        Test.startTest();
        LayoutController.getAllLayouts();
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