public with sharing class LayoutController {

    // Wrapper class to encapsulate layout data
    public class LayoutWrapper {
        @AuraEnabled public String layoutName;    // Holds the unique Name (e.g., 'Behavioral')
        @AuraEnabled public String displayName;   // Display-friendly Name__c
        @AuraEnabled public String title;         // Title of the form (Title__c)
        @AuraEnabled public String layoutJson;    // JSON data of the layout (Form_JSON__c)
        @AuraEnabled public Boolean isDefault;    // Indicates if it’s a default layout
        @AuraEnabled public String formType;  
        @AuraEnabled public String dateTimeString; // Stores Name for use as form type during cloning
        @AuraEnabled public String formModule;
        @AuraEnabled public Id createdById;
    	@AuraEnabled public String createdByName;

    }

    // Save or update layout in Custom_Form__c custom object
   @AuraEnabled
public static String saveLayout(String layoutData, String layoutName, String title, String actionType, String orgId,String formModule) {
    if (String.isBlank(title)) {
        throw new AuraHandledException('Title of the form is required.');
    }

    try {
        System.debug('[DEBUG] Starting saveLayout');
        System.debug('[DEBUG] Parameters - layoutData: ' + layoutData + ', layoutName: ' + layoutName + ', title: ' + title + ', actionType: ' + actionType);

        Custom_Form__c layout;

        if (actionType == 'edit') {
            System.debug('[DEBUG] Action type is edit');
            List<Custom_Form__c> existingLayouts = [
                SELECT Id, Name, Name__c, Title__c, Form_JSON__c, Orgnisation_Id__c
                FROM Custom_Form__c 
                WHERE Name = :layoutName 
                LIMIT 1
            ];

            if (existingLayouts.isEmpty()) {
                throw new AuraHandledException('No layout found with the specified Name for editing: ' + layoutName);
            }

            layout = existingLayouts[0];
            layout.Form_JSON__c = layoutData;
            layout.Title__c = title;
			layout.Orgnisation_Id__c = orgId;
            layout.Form_Module__c = formModule;
            update layout;
            return layout.Name__c;

        } else if (actionType == 'clone') {
            layout = new Custom_Form__c(Name__c = layoutName, Form_JSON__c = layoutData, Title__c = title, Orgnisation_Id__c = orgId);

            insert layout;
            return layout.Name__c;

        } else {
            // New layout creation
            layout = new Custom_Form__c(Name__c = layoutName, Form_JSON__c = layoutData, Title__c = title,Orgnisation_Id__c = orgId,Form_Module__c = formModule);

            insert layout;
            return layout.Name__c;
        }
    } catch (Exception e) {
        throw new AuraHandledException('Failed to save layout: ' + e.getMessage());
    }
}



    // Delete layout from Custom_Form__c by Name
    @AuraEnabled
public static void deleteLayout(String layoutName) {
    System.debug('Attempting to delete layout with Name: ' + layoutName); // Debug log

    if (String.isBlank(layoutName)) {
        throw new AuraHandledException('No layoutName provided for deletion');
    }

    try {
        List<Custom_Form__c> layoutToDelete = [
            SELECT Name 
            FROM Custom_Form__c 
            WHERE Name = :layoutName // Ensure correct field (Name__c) is used
            LIMIT 1
        ];
        if (!layoutToDelete.isEmpty()) {
            delete layoutToDelete[0];
            System.debug('Layout successfully deleted: ' + layoutName); // Success debug log
        } else {
            throw new AuraHandledException('No layout found with the specified Name: ' + layoutName);
        }
    } catch (Exception e) {
        System.debug('Exception in deleteLayout method: ' + e.getMessage()); // Error debug log
        throw new AuraHandledException('Failed to delete layout: ' + e.getMessage());
    }
}





    // Retrieve layout JSON and details by unique Name from Custom_Form__c
    @AuraEnabled
    public static LayoutWrapper getLayoutData(String layoutName) {
        try {
            System.debug('getLayoutData: Attempting to retrieve layout with Name = ' + layoutName);

            // Query using Name as the unique identifier
            Custom_Form__c layoutRecord = [
                SELECT Name, Name__c, Form_JSON__c, Title__c,Form_Module__c
                FROM Custom_Form__c
                WHERE Name = :layoutName
                LIMIT 1
            ];

            LayoutWrapper layoutWrapper = new LayoutWrapper();
            layoutWrapper.layoutName = layoutRecord.Name;         // Use Name for unique ID
            layoutWrapper.displayName = layoutRecord.Name__c;     // Use Name__c for display
            layoutWrapper.layoutJson = layoutRecord.Form_JSON__c;
            layoutWrapper.title = layoutRecord.Title__c;
            layoutWrapper.formModule = layoutRecord.Form_Module__c;
            layoutWrapper.isDefault = false; // This is a custom layout

            System.debug('Retrieved layout data: ' + layoutWrapper);

            return layoutWrapper;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to retrieve layout data: ' + e.getMessage());
        }
    }

    // Retrieve all layouts from both Custom_Form__c and Default_Form__c
    @AuraEnabled
public static Map<String, List<LayoutWrapper>> getAllLayouts(String orgId,String formModule) {
    List<LayoutWrapper> customLayouts = new List<LayoutWrapper>();
    List<LayoutWrapper> defaultLayouts = new List<LayoutWrapper>();

    // ✅ Fetch only Custom_Form__c records matching the given Org ID
    for (Custom_Form__c customLayout : [
        SELECT Name, Name__c, Form_JSON__c, Title__c, CreatedDate, Orgnisation_Id__c,Form_Module__c,CreatedById, CreatedBy.Name
        FROM Custom_Form__c 
        WHERE Orgnisation_Id__c = :orgId
        AND Form_Module__c = :formModule
        ORDER BY CreatedDate DESC
    ]) {
        LayoutWrapper layoutWrapper = new LayoutWrapper();
        layoutWrapper.layoutName = customLayout.Name;  // Unique identifier
        layoutWrapper.displayName = customLayout.Name__c; // Name__c for UI display
        layoutWrapper.layoutJson = customLayout.Form_JSON__c;
        layoutWrapper.title = customLayout.Title__c;
        layoutWrapper.dateTimeString = customLayout.CreatedDate.format('MM/dd/yyyy, h:mm a');
        layoutWrapper.isDefault = false;
        layoutWrapper.formModule = customLayout.Form_Module__c;
        layoutWrapper.createdById     = customLayout.CreatedById;
        layoutWrapper.createdByName   = customLayout.CreatedBy.Name;
        customLayouts.add(layoutWrapper);
    }

    // ✅ Fetch all Default_Form__c records (No orgId check for default layouts)
    for (Default_Form__c defaultForm : [
        SELECT Name, Name__c, Form_JSON__c,CreatedDate,
               CreatedById, CreatedBy.Name FROM Default_Form__c
    ]) {
        LayoutWrapper layoutWrapper = new LayoutWrapper();
        layoutWrapper.layoutName = defaultForm.Name;  // Unique Name for backend reference
        layoutWrapper.displayName = defaultForm.Name__c; // Name__c for display in frontend
        layoutWrapper.layoutJson = defaultForm.Form_JSON__c;
        layoutWrapper.isDefault = true;
        defaultLayouts.add(layoutWrapper);
    }

    Map<String, List<LayoutWrapper>> layoutMap = new Map<String, List<LayoutWrapper>>();
    layoutMap.put('DefaultLayouts', defaultLayouts);
    layoutMap.put('CustomLayouts', customLayouts);
    return layoutMap;
}


    // Retrieve default form layout JSON and details from Default_Form__c by Name for cloning
    @AuraEnabled
    public static Map<String, String> getDefaultFormLayout(String layoutName) {
        try {
            System.debug('Attempting to retrieve default layout with Name = ' + layoutName);

            List<Default_Form__c> defaultForms = [
                SELECT Name, Name__c, Form_JSON__c,Form_Module__c
                FROM Default_Form__c
                WHERE Name = :layoutName
                LIMIT 1
            ];

            if (defaultForms.isEmpty()) {
                throw new AuraHandledException('No layout found with the specified Name: ' + layoutName);
            }

            Default_Form__c defaultForm = defaultForms[0];
            Map<String, String> layoutData = new Map<String, String>();
            layoutData.put('formType', defaultForm.Name);           // Use Name as formType
            layoutData.put('Name__c', defaultForm.Name__c);         // Name__c for display
            layoutData.put('Form_JSON__c', defaultForm.Form_JSON__c);
            layoutData.put('Form_Module__c', defaultForm.Form_Module__c);

            System.debug('Retrieved layout data for cloning: ' + layoutData);
            System.debug('Retrieved layout data for cloning - formType: ' + layoutData.get('formType'));
        System.debug('Retrieved layout data for cloning - Name__c: ' + layoutData.get('Name__c'));
            

            return layoutData;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to retrieve default form layout for ' + layoutName + ': ' + e.getMessage());
        }
    }
}