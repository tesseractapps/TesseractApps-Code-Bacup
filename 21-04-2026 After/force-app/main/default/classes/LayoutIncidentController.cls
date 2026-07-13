public class LayoutIncidentController {

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

    // Save or update layout in Incident_Form_Template__c custom object
   @AuraEnabled
public static String saveLayout(String layoutData, String layoutName, String title, String actionType, String orgId,String formModule) {
    if (String.isBlank(title)) {
        throw new AuraHandledException('Title of the form is required.');
    }

    try {
        System.debug('[DEBUG] Starting saveLayout');
        System.debug('[DEBUG] Parameters - layoutData: ' + layoutData + ', layoutName: ' + layoutName + ', title: ' + title + ', actionType: ' + actionType);

        Incident_Form_Template__c layout;

        if (actionType == 'edit') {
            System.debug('[DEBUG] Action type is edit');
            List<Incident_Form_Template__c> existingLayouts = [
                SELECT Id, Name, Name__c, Title__c, Form_JSON__c, Orgnisation_Id__c
                FROM Incident_Form_Template__c 
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
            layout = new Incident_Form_Template__c(Name__c = layoutName, Form_JSON__c = layoutData, Title__c = title, Orgnisation_Id__c = orgId);

            insert layout;
            return layout.Name__c;

        } else {
            // New layout creation
            layout = new Incident_Form_Template__c(Name__c = layoutName, Form_JSON__c = layoutData, Title__c = title,Orgnisation_Id__c = orgId,Form_Module__c = formModule);

            insert layout;
            return layout.Name__c;
        }
    } catch (Exception e) {
        throw new AuraHandledException('Failed to save layout: ' + e.getMessage());
    }
}


@AuraEnabled
public static Boolean doesLayoutTitleExist(
    String title,
    String orgId
) {

    Integer cnt = [
        SELECT COUNT()
        FROM Incident_Form_Template__c
        WHERE Title__c = :title
        AND Orgnisation_Id__c = :orgId
    ];

    return cnt > 0;
}



















    // Delete layout from Incident_Form_Template__c by Name
@AuraEnabled
public static void deleteLayout(Id layoutId) {

    if (layoutId == null) {
        throw new AuraHandledException('No layoutId provided');
    }

    try {

        Incident_Form_Template__c layout = [
            SELECT Id, Form_JSON__c
            FROM Incident_Form_Template__c
            WHERE Id = :layoutId
            LIMIT 1
        ];

        // ==========================
        // ☁️ AWS delete
        // ==========================
        if (String.isNotBlank(layout.Form_JSON__c)) {

            try {

                Map<String, Object> awsMeta =
                    (Map<String, Object>) JSON.deserializeUntyped(
                        layout.Form_JSON__c
                    );

                if (
                    awsMeta.containsKey('bucket') &&
                    awsMeta.containsKey('key')
                ) {

                    WordEditorController.deleteFromAws(
                        (String) awsMeta.get('bucket'),
                        (String) awsMeta.get('key')
                    );
                }

            } catch (Exception ex) {

                System.debug(
                    '⚠️ AWS delete failed, continuing SF delete: ' +
                    ex.getMessage()
                );
            }
        }

        delete layout;

    } catch (Exception e) {

        throw new AuraHandledException(
            'Failed to delete draft form: ' + e.getMessage()
        );
    }
}


    @AuraEnabled
    public static LayoutWrapper getLayoutData(String layoutName) {
        try {
            System.debug('getLayoutData: Attempting to retrieve layout with Name = ' + layoutName);

            // Query using Name as the unique identifier
            Incident_Form_Template__c layoutRecord = [
                SELECT Name, Name__c, Form_JSON__c, Title__c,Form_Module__c
                FROM Incident_Form_Template__c
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




@AuraEnabled
public static LayoutWrapper getLayoutDataById(Id templateId) {

    try {

        System.debug('🔍 getLayoutDataById called with Id = ' + templateId);

        Incident_Form_Template__c layoutRecord = [
            SELECT Id,
                   Name,
                   Name__c,
                   Form_JSON__c,
                   Title__c,
                   Form_Module__c
            FROM Incident_Form_Template__c
            WHERE Id = :templateId
            LIMIT 1
        ];

        LayoutWrapper layoutWrapper = new LayoutWrapper();

        layoutWrapper.layoutName = layoutRecord.Name;
        layoutWrapper.displayName = layoutRecord.Name__c;
        layoutWrapper.layoutJson = layoutRecord.Form_JSON__c;
        layoutWrapper.title = layoutRecord.Title__c;
        layoutWrapper.formModule = layoutRecord.Form_Module__c;
        layoutWrapper.isDefault = false;

        System.debug('✅ Retrieved layout data: ' + JSON.serialize(layoutWrapper));


        return layoutWrapper;

    } catch (QueryException qe) {

        System.debug('❌ QueryException in getLayoutDataById: ' + qe.getMessage());

        throw new AuraHandledException(
            'Draft form not found. It may have been deleted.'
        );

    } catch (Exception e) {

        System.debug('❌ Exception in getLayoutDataById: ' + e.getMessage());

        throw new AuraHandledException(
            'Failed to retrieve layout data: ' + e.getMessage()
        );
    }
}


    // Retrieve all layouts from both Incident_Form_Template__c and Default_Form__c
    @AuraEnabled
public static Map<String, List<LayoutWrapper>> getAllLayouts(String orgId,String formModule) {
    List<LayoutWrapper> customLayouts = new List<LayoutWrapper>();
    List<LayoutWrapper> defaultLayouts = new List<LayoutWrapper>();

    // ✅ Fetch only Incident_Form_Template__c records matching the given Org ID
    for (Incident_Form_Template__c customLayout : [
        SELECT Name, Name__c, Form_JSON__c, Title__c, CreatedDate, Orgnisation_Id__c,Form_Module__c,CreatedById, CreatedBy.Name
        FROM Incident_Form_Template__c 
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




public class UnifiedFormWrapper {

    @AuraEnabled public String recordId;
    @AuraEnabled public String formName;
    @AuraEnabled public String formType;
    @AuraEnabled public Datetime createdDate;
    @AuraEnabled public String createdByName;
    @AuraEnabled public String createdByAvatar;
    @AuraEnabled public String category; // Draft / Published / Default
    @AuraEnabled public String staffName;
    @AuraEnabled public List<StaffSummary> assignedStaff;
}

public class StaffSummary {

    @AuraEnabled public Id staffId;
    @AuraEnabled public String name;
    @AuraEnabled public String picture;
}

@AuraEnabled
public static List<UnifiedFormWrapper> getUnifiedForms() {

    System.debug('🚀 getUnifiedForms invoked');

    List<UnifiedFormWrapper> result =
        new List<UnifiedFormWrapper>();

    // ================================
    // 🔵 Draft Templates
    // ================================

    for (Incident_Form_Template__c t : [
        SELECT Id,
               Title__c,
               Form_Module__c,
               CreatedDate,
               CreatedBy.Name,
               CreatedBy.SmallPhotoUrl
        FROM Incident_Form_Template__c
    ]) {

        UnifiedFormWrapper w =
            new UnifiedFormWrapper();

        w.recordId = t.Id;
        w.formName = t.Title__c;
        w.formType = t.Form_Module__c;
        w.createdDate = t.CreatedDate;

        w.createdByName =
            t.CreatedBy != null
                ? t.CreatedBy.Name
                : null;

        w.createdByAvatar =
            t.CreatedBy != null
                ? t.CreatedBy.SmallPhotoUrl
                : null;

        w.category = 'Draft';

        w.assignedStaff =
            new List<StaffSummary>();

        result.add(w);
    }

    // ================================
    // 🟢 Published Forms
    // ================================

    List<Incident_Form__c> publishedForms = [
        SELECT Id,
               Name__c,
               Form_Type__c,
               CreatedDate,
               CreatedBy.Name,
               CreatedBy.SmallPhotoUrl
        FROM Incident_Form__c
        WHERE Form_Type__c = 'Incident Register'
    ];

    Set<Id> publishedFormIds =
        new Set<Id>();

    for (Incident_Form__c f : publishedForms) {
        publishedFormIds.add(f.Id);
    }

    // ================================
    // 🔍 FETCH STAFF WHO HAVE ACCESS
    // ================================

    Map<Id, List<StaffSummary>> formToStaffMap =
        new Map<Id, List<StaffSummary>>();

    for (Staff__c s : [
        SELECT Id,
               Accessible_Forms__c,
               NameToDisplay__c,
               Picture__c
        FROM Staff__c
    ]) {

        if (String.isBlank(
                s.Accessible_Forms__c)) {
            continue;
        }

        List<String> formIds =
            s.Accessible_Forms__c.split(';');

        for (String fid : formIds) {

            if (!publishedFormIds
                    .contains(fid)) {
                continue;
            }

            if (!formToStaffMap
                    .containsKey(fid)) {

                formToStaffMap.put(
                    fid,
                    new List<StaffSummary>()
                );
            }

            StaffSummary ss =
                new StaffSummary();

            ss.staffId = s.Id;
            ss.name = s.NameToDisplay__c;
            ss.picture = s.Picture__c;

            formToStaffMap
                .get(fid)
                .add(ss);
        }
    }

    // ================================
    // 🔗 BUILD PUBLISHED WRAPPERS
    // ================================

    for (Incident_Form__c f : publishedForms) {

        UnifiedFormWrapper w =
            new UnifiedFormWrapper();

        w.recordId = f.Id;
        w.formName = f.Name__c;
        w.formType = f.Form_Type__c;
        w.createdDate = f.CreatedDate;

        w.createdByName =
            f.CreatedBy != null
                ? f.CreatedBy.Name
                : null;

        w.createdByAvatar =
            f.CreatedBy != null
                ? f.CreatedBy.SmallPhotoUrl
                : null;

        w.category = 'Published';

        w.assignedStaff =
            formToStaffMap.containsKey(f.Id)
                ? formToStaffMap.get(f.Id)
                : new List<StaffSummary>();

        result.add(w);
    }

    // ================================
    // ⭐ DEFAULT INCIDENT (GLOBAL)
    // ================================

    List<Incident_Form__c> defaultForms = [
        SELECT Id,
               Name__c,
               Form_Type__c,
               CreatedDate,
               CreatedBy.Name,
               CreatedBy.SmallPhotoUrl
        FROM Incident_Form__c
        WHERE Status__c = 'Default'
        LIMIT 1
    ];

    if (!defaultForms.isEmpty()) {

        Incident_Form__c df =
            defaultForms[0];

        // 👥 ALL STAFF
        List<StaffSummary> allStaff =
            new List<StaffSummary>();

        for (Staff__c s : [
            SELECT Id,
                   NameToDisplay__c,
                   Picture__c
            FROM Staff__c
        ]) {

            StaffSummary ss =
                new StaffSummary();

            ss.staffId = s.Id;
            ss.name = s.NameToDisplay__c;
            ss.picture = s.Picture__c;

            allStaff.add(ss);
        }

        UnifiedFormWrapper w =
            new UnifiedFormWrapper();

        w.recordId = df.Id;
        w.formName = df.Name__c;
        w.formType = df.Form_Type__c;
        w.createdDate = df.CreatedDate;

        w.createdByName =
            df.CreatedBy != null
                ? df.CreatedBy.Name
                : null;

        w.createdByAvatar =
            df.CreatedBy != null
                ? df.CreatedBy.SmallPhotoUrl
                : null;

        w.category = 'Default';

        w.assignedStaff = allStaff;

        result.add(w);
    }

    // ================================
    // 🔥 SORT NON-DEFAULT FIRST
    // ================================

    List<UnifiedFormWrapper> defaults =
        new List<UnifiedFormWrapper>();

    List<UnifiedFormWrapper> others =
        new List<UnifiedFormWrapper>();

    for (UnifiedFormWrapper w : result) {

        if (w.category == 'Default') {
            defaults.add(w);
        } else {
            others.add(w);
        }
    }

    others.sort(
        new UnifiedFormDateSorter()
    );

    // default ALWAYS LAST
    others.addAll(defaults);

    result = others;

    System.debug(
        '✅ Unified forms total returned: ' +
        result.size()
    );

    return result;
}

public class UnifiedFormDateSorter
    implements Comparator<UnifiedFormWrapper> {

    public Integer compare(
        UnifiedFormWrapper a,
        UnifiedFormWrapper b
    ) {

        if (a.createdDate ==
            b.createdDate) return 0;

        if (a.createdDate == null)
            return 1;

        if (b.createdDate == null)
            return -1;

        return
            b.createdDate.getTime() >
            a.createdDate.getTime()
                ? 1
                : -1;
    }
}




}