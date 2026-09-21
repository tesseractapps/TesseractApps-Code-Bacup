public without sharing class LayoutController {

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
         @AuraEnabled public String audience;

         @AuraEnabled public String formGroupId;
    @AuraEnabled public String versionLabel;

    }

    // Save or update layout in Custom_Form__c custom object
   @AuraEnabled
public static String saveLayout(String layoutData, String layoutName, String title, String actionType, String orgId,String formModule,String audience ) {
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
                SELECT Id, Name, Name__c, Title__c, Form_JSON__c, Orgnisation_Id__c, Audience__c
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
            layout.Audience__c = audience; 
            update layout;
            return layout.Name__c;

        } else if (actionType == 'clone') {
            layout = new Custom_Form__c(Name__c = layoutName, Form_JSON__c = layoutData, Title__c = title, Audience__c = audience, Orgnisation_Id__c = orgId);

            insert layout;
            return layout.Name__c;

        } else {
            // New layout creation
            layout = new Custom_Form__c(Name__c = layoutName, Form_JSON__c = layoutData, Title__c = title,Orgnisation_Id__c = orgId,Form_Module__c = formModule, Audience__c = audience );

            insert layout;
            return layout.Name__c;
        }} catch (Exception e) { throw new AuraHandledException('Failed to save layout: ' + e.getMessage());
    }
}


@AuraEnabled
public static Boolean doesLayoutTitleExist(
    String title,
    String orgId,
    String audience
) {

    if (String.isBlank(title)) {
        return false;
    }

    Integer cnt = [
        SELECT COUNT()
        FROM Dynamic_Form__c
        WHERE Name__c = :title
        AND Org_Id__c = :orgId
        AND Audience__c = :audience

        // ✅ ONLY VERSIONED FORMS
        AND Form_Group_Id__c != NULL
        AND Form_Group_Id__c != ''
        AND Version_Label__c != NULL
        AND Version_Label__c != ''
    ];

    return cnt > 0;
}


















    // Delete layout from Custom_Form__c by Name
@AuraEnabled
public static void deleteLayout(String layoutName) {

    System.debug(
        'Attempting to delete layout with Id: ' +
        layoutName
    );

    if (String.isBlank(layoutName)) { throw new AuraHandledException( 'No layout id provided for deletion');
    }

    try {

        // 🔥 Query by ID now
        Custom_Form__c layout = [
            SELECT Id,
                   Form_JSON__c
            FROM Custom_Form__c
            WHERE Id = :layoutName
            LIMIT 1
        ];

        // ============================
        // 🔥 AWS DELETE (if applicable)
        // ============================
        if (!String.isBlank(layout.Form_JSON__c)) {

            try {

                Map<String, Object> awsMeta =
                    (Map<String, Object>)
                        JSON.deserializeUntyped(
                            layout.Form_JSON__c
                        );

                if (
                    awsMeta != null &&
                    awsMeta.containsKey('bucket') &&
                    awsMeta.containsKey('key')
                ) {

                    String bucket =
                        (String) awsMeta.get('bucket');

                    String keyVal =
                        (String) awsMeta.get('key');

                    System.debug(
                        '🗑️ Deleting AWS JSON: bucket=' +
                        bucket +
                        ', key=' +
                        keyVal
                    );

                    WordEditorController.deleteFromAws(
                        bucket,
                        keyVal
                    );

                } else {

                    System.debug(
                        '⚠️ No AWS metadata found — skipping AWS delete.'
                    );
                }

            } catch (Exception awsEx) {

                System.debug(
                    '⚠️ AWS delete skipped: ' +
                    awsEx.getMessage()
                );

                // DO NOT stop SF delete
            }
        }

        // ============================
        // 🗑️ Salesforce delete
        // ============================
        delete layout; } catch (Exception e) { throw new AuraHandledException('Failed to delete layout: ' + e.getMessage()
        );
    }
}





// Retrieve layout JSON and details by Id from Custom_Form__c
@AuraEnabled
public static LayoutWrapper getLayoutData(String layoutName) {

    try {

        System.debug(
            'getLayoutData: Attempting to retrieve layout with Id = ' +
            layoutName
        );

        // 🔥 Query using ID instead of Name
        Custom_Form__c layoutRecord = [
            SELECT Id,
                   Name,
                   Name__c,
                   Form_JSON__c,
                   Title__c,
                   Form_Module__c,
                   Audience__c
            FROM Custom_Form__c
            WHERE Id = :layoutName
            LIMIT 1
        ];

        LayoutWrapper layoutWrapper = new LayoutWrapper();

        // keep same wrapper fields
        layoutWrapper.layoutName  = layoutRecord.Id;
        layoutWrapper.displayName = layoutRecord.Name__c;
        layoutWrapper.layoutJson  = layoutRecord.Form_JSON__c;
        layoutWrapper.title       = layoutRecord.Title__c;
        layoutWrapper.formModule  = layoutRecord.Form_Module__c;
        layoutWrapper.isDefault   = false;
        layoutWrapper.audience    = layoutRecord.Audience__c;

        System.debug('Retrieved layout data: ' + layoutWrapper);

        return layoutWrapper; } catch (Exception e) { throw new AuraHandledException( 'Failed to retrieve layout data: ' + e.getMessage() );
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

            if (defaultForms.isEmpty()) {throw new AuraHandledException('No layout found with the specified Name: ' + layoutName);
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
            

            return layoutData; } catch (Exception e) { throw new AuraHandledException('Failed to retrieve default form layout for ' + layoutName + ': ' + e.getMessage());
        }
    }



// @AuraEnabled
// public static List<FormUnifiedWrapper> getUnifiedForms(
//     String orgId,
//     String formModule,
//     String audience
// ) {

//     List<FormUnifiedWrapper> result = new List<FormUnifiedWrapper>();

//     /* ======================================================
//        🔥 Build access map for PUBLISHED forms
//     ====================================================== */

//     Map<Id, List<AccessUserDTO>> accessByFormId =
//         new Map<Id, List<AccessUserDTO>>();

//     // ================= STAFF =====================
//     // ================= STAFF =====================
//         if (audience == 'Staff') {

//             // ------------------------------------------
//             // Get Staff IDs via Facility → Organisation
//             // ------------------------------------------

//             Set<Id> staffIds = new Set<Id>();

//             for (Staff_Facility__c sf : [
//                 SELECT Staff__c
//                 FROM Staff_Facility__c
//                 WHERE Active__c = true
//                 AND Facility__r.Organisation__c = :orgId
//             ]) {
//                 staffIds.add(sf.Staff__c);
//             }

//             if (!staffIds.isEmpty()) {

//                 for (Staff__c s : [
//                     SELECT Id,
//                         Name,
//                         Picture__c,
//                         Accessible_Custom_Forms__c
//                     FROM Staff__c
//                     WHERE Id IN :staffIds
//                     AND Status__c = true
//                 ]) {

//                     if (String.isBlank(s.Accessible_Custom_Forms__c))
//                         continue;

//                     // split by ; or newline
//                     for (String fid :
//                         s.Accessible_Custom_Forms__c.split('[;\\n\\r]+')
//                     ) {

//                         fid = fid.trim();

//                         if (String.isBlank(fid)) continue;

//                         // normalize to 15 chars
//                         if (fid.length() >= 15) {
//                             fid = fid.substring(0, 15);
//                         }

//                         Id formId = (Id) fid;

//                         if (!accessByFormId.containsKey(formId)) {
//                             accessByFormId.put(
//                                 formId,
//                                 new List<AccessUserDTO>()
//                             );
//                         }

//                         accessByFormId.get(formId).add(
//                             new AccessUserDTO(
//                                 s.Id,
//                                 s.Name,
//                                 s.Picture__c
//                             )
//                         );
//                     }
//                 }
//             }
//         }


//     // ================= PARTICIPANTS =====================
//     else {

//         String orgId15 = orgId != null && orgId.length() >= 15
//     ? orgId.substring(0, 15)
//     : orgId;


//         for (Client__c c : [
//             SELECT Id,
//                    Name,
//                    Picture__c,
//                    Accessible_Forms__c
//             FROM Client__c
//             WHERE Organization_Name__c = :orgId15
//         ]) {

//             if (String.isBlank(c.Accessible_Forms__c)) continue;

//             for (String fid :
//                 c.Accessible_Forms__c.split('[;\\n\\r]+')
//             ) {

//                 fid = fid.trim();

//                 if (String.isBlank(fid)) continue;

//                 if (fid.length() >= 15) {
//                     fid = fid.substring(0, 15);
//                 }

//                 Id formId = (Id) fid;

//                 if (!accessByFormId.containsKey(formId)) {
//                     accessByFormId.put(
//                         formId,
//                         new List<AccessUserDTO>()
//                     );
//                 }

//                 accessByFormId.get(formId).add(
//                     new AccessUserDTO(
//                         c.Id,
//                         c.Name,
//                         c.Picture__c
//                     )
//                 );
//             }
//         }
//     }

//     /* ======================================================
//        🟢 PUBLISHED → Dynamic_Form__c
//     ====================================================== */

//     for (Dynamic_Form__c p : [
//         SELECT Id,
//                Name__c,
//                CreatedDate,
//                CreatedBy.Name,
//                Audience__c,
//                Version_Label__c,
//                	Is_Assigned__c
//         FROM Dynamic_Form__c
//         WHERE Org_Id__c = :orgId
//         AND Audience__c = :audience
//         ORDER BY CreatedDate DESC
//     ]) {

//         List<AccessUserDTO> users =
//             accessByFormId.containsKey(p.Id)
//                 ? accessByFormId.get(p.Id)
//                 : new List<AccessUserDTO>();

//         result.add(new FormUnifiedWrapper(
//             p.Id,
//             p.Name__c,
//             p.CreatedDate,
//             p.CreatedBy.Name,
//             p.Version_Label__c,
//             users,
             
//             audience,
//             p.Is_Assigned__c
//         ));
//     }

//     return result;
// }



// public class FormUnifiedWrapper {

//     @AuraEnabled public Id recordId;
//     @AuraEnabled public String formName;
//     @AuraEnabled public Datetime createdDate;
//     @AuraEnabled public String createdByName;
//     @AuraEnabled public String category;
//     @AuraEnabled public Boolean isAssigned;

//     // 🔥 NEW
//     @AuraEnabled public List<AccessUserDTO> staffUsers;
//     @AuraEnabled public List<AccessUserDTO> participantUsers;

//     public FormUnifiedWrapper(
//         Id id,
//         String name,
//         Datetime dt,
//         String createdBy,
//         String cat,
//         List<AccessUserDTO> users,
//         String audience,
//         Boolean isAssignedVal
//     ) {
//         recordId = id;
//         formName = name;
//         createdDate = dt;
//         createdByName = createdBy;
//         category = cat;
//         isAssigned = isAssignedVal;

//         if (audience == 'Staff') {
//             staffUsers = users;
//             participantUsers = new List<AccessUserDTO>();
//         } else {
//             participantUsers = users;
//             staffUsers = new List<AccessUserDTO>();
//         }
//     }
// }

@AuraEnabled
public static List<FormUnifiedWrapper> getUnifiedForms(
    String orgId,
    String formModule,
    String audience
) {

    List<FormUnifiedWrapper> result = new List<FormUnifiedWrapper>();

    Map<Id, List<AccessUserDTO>> accessByFormId =
        new Map<Id, List<AccessUserDTO>>();

    // ================= STAFF =====================
    if (audience == 'Staff') {

        Set<Id> staffIds = new Set<Id>();

        for (Staff_Facility__c sf : [ SELECT Staff__c FROM Staff_Facility__c WHERE Active__c = true AND Facility__r.Organisation__c = :orgId]) { staffIds.add(sf.Staff__c);  } if (!staffIds.isEmpty()) { for (Staff__c s : [SELECT Id, Name, Picture__c, Accessible_Custom_Forms__c FROM Staff__c  WHERE Id IN :staffIds AND Status__c = true]) {if (String.isBlank(s.Accessible_Custom_Forms__c)) continue;for (String fid : s.Accessible_Custom_Forms__c.split('[;\\n\\r]+')) { fid = fid.trim();if (String.isBlank(fid)) continue;if (fid.length() >= 15) { fid = fid.substring(0, 15);} Id formId = (Id) fid; if (!accessByFormId.containsKey(formId)) {accessByFormId.put(formId, new List<AccessUserDTO>()); }accessByFormId.get(formId).add( new AccessUserDTO(s.Id, s.Name, s.Picture__c));
                }
            }
        }
    }

    // ================= PARTICIPANTS =====================
    // else {

    //     for (Client__c c : [
    //         SELECT Id, Name, Picture__c, Accessible_Forms__c
    //         FROM Client__c
    //         WHERE Organization_Name__c = :orgId
    //     ]) {

    //         if (String.isBlank(c.Accessible_Forms__c)) continue;

    //         for (String fid : c.Accessible_Forms__c.split('[;\\n\\r]+')) {

    //             fid = fid.trim();
    //             if (String.isBlank(fid)) continue;

    //             if (fid.length() >= 15) {
    //                 fid = fid.substring(0, 15);
    //             }

    //             Id formId = (Id) fid;

    //             if (!accessByFormId.containsKey(formId)) {
    //                 accessByFormId.put(formId, new List<AccessUserDTO>());
    //             }

    //             accessByFormId.get(formId).add(
    //                 new AccessUserDTO(c.Id, c.Name, c.Picture__c)
    //             );
    //         }
    //     }
    // }

    else {

    // 🔥 FIX 1: Normalize orgId (15 vs 18)
    String orgId15;

    if (String.isNotBlank(orgId)) {orgId15 = orgId.length() == 18 ? orgId.substring(0, 15): orgId;
    }

    for (Client__c c : [
        SELECT Id, Name, Picture__c, Accessible_Forms__c
        FROM Client__c
        WHERE Organization_Name__c = :orgId15 ]) {if (String.isBlank(c.Accessible_Forms__c)) continue;for (String fid : c.Accessible_Forms__c.split('[;\\n\\r\\s]+')) { fid = fid.trim();if (String.isBlank(fid)) continue;if (fid.length() == 18) {fid = fid.substring(0, 15);}Id formId; try {formId = (Id) fid;} catch (Exception e) {continue;}if (!accessByFormId.containsKey(formId)) {accessByFormId.put(formId, new List<AccessUserDTO>() ); }accessByFormId.get(formId).add(new AccessUserDTO( c.Id,c.Name, c.Picture__c
                )
            );
        }
    }
}

    // ================= DYNAMIC FORMS =====================

    for (Dynamic_Form__c p : [SELECT Id, Name__c, CreatedDate, CreatedBy.Name,Version_Label__c,Form_Group_Id__c, Is_Assigned__c FROM Dynamic_Form__c WHERE Org_Id__c = :orgId AND Audience__c = :audience AND Form_Group_Id__c LIKE '%' AND Version_Label__c LIKE '%' ORDER BY CreatedDate DESC]) { List<AccessUserDTO> users =accessByFormId.containsKey(p.Id)? accessByFormId.get(p.Id): new List<AccessUserDTO>();result.add(new FormUnifiedWrapper(p.Id,p.Form_Group_Id__c, p.Name__c, p.CreatedDate, p.CreatedBy.Name,p.Version_Label__c, users,audience, p.Is_Assigned__c
        ));
    }

    return result;
}

public class FormUnifiedWrapper {

    @AuraEnabled public Id recordId;
    @AuraEnabled public String formGroupId;
    @AuraEnabled public String formName;
    @AuraEnabled public Datetime createdDate;
    @AuraEnabled public String createdByName;
    @AuraEnabled public String versionLabel;
    @AuraEnabled public Boolean isAssigned;

    @AuraEnabled public List<AccessUserDTO> staffUsers;
    @AuraEnabled public List<AccessUserDTO> participantUsers;

    public FormUnifiedWrapper(
        Id id,
        String groupId,
        String name,
        Datetime dt,
        String createdBy,
        String version,
        List<AccessUserDTO> users,
        String audience,
        Boolean isAssignedVal
    ) {
        recordId = id;
        formGroupId = groupId;
        formName = name;
        createdDate = dt;
        createdByName = createdBy;
        versionLabel = version;
        isAssigned = isAssignedVal;

        if (audience == 'Staff') {
            staffUsers = users;
            participantUsers = new List<AccessUserDTO>();
        } else {
            participantUsers = users;
            staffUsers = new List<AccessUserDTO>();
        }
    }
}



public class AccessUserDTO {

    @AuraEnabled public Id id;
    @AuraEnabled public String name;
    @AuraEnabled public String pictureUrl;
    @AuraEnabled public String initials;

    public AccessUserDTO(Id id, String name, String pic) {

        this.id = id;
        this.name = name;
        this.pictureUrl = pic;

        if (name != null) {
            List<String> parts = name.split(' ');
            String init = '';
            for (String p : parts) {
                if (p.length() > 0) {
                    init += p.substring(0,1);
                }
            }
            this.initials =
                init.length() > 2
                    ? init.substring(0,2)
                    : init;
        }
    }
}

@AuraEnabled
public static List<Map<String, String>> fetchStaffRolesByFacility(
    List<Id> facilityIds
) {

    List<Facility_Role__c> roles = [
        SELECT Role_Name__c,
               Facility__r.Name
        FROM Facility_Role__c
        WHERE Facility__c IN :facilityIds
        AND Is_Active__c = true
        AND Role_Name__c != null
    ];

    // 🔥 Deduplicate by Role + Facility
    Set<String> uniqueRoles = new Set<String>();

    List<Map<String, String>> output =
        new List<Map<String, String>>();

    for (Facility_Role__c r : roles) {

        String roleName =
            r.Role_Name__c != null
            ? r.Role_Name__c.trim()
            : null;

        String facilityName =
            (r.Facility__r != null)
            ? r.Facility__r.Name
            : '';

        if (String.isBlank(roleName))
            continue;

        // unique key = role + facility
        String uniqueKey =
            roleName + '|' + facilityName;

        if (!uniqueRoles.contains(uniqueKey)) {

            uniqueRoles.add(uniqueKey);

            output.add(new Map<String, String>{
                'id' => uniqueKey,          // stable key
                'name' => roleName,
                'facilityName' => facilityName
            });
        }
    }

    return output;
}

// @AuraEnabled
// public static List<Map<String,Object>> getStaffForAssign(
//     List<Id> facilityIds,
//     List<String> roleNames
// ) {

//     // ----------------------------------
//     // Staff ↔ Facility
//     // ----------------------------------

//     List<Staff_Facility__c> staffFacilities = [
//         SELECT
//             Staff__c,
//             Staff__r.NameToDisplay__c,
//             Staff__r.Picture__c,
//             Staff__r.Email_Address__c,
//             Facility__c,
//             Facility__r.Name
//         FROM Staff_Facility__c
//         WHERE Facility__c IN :facilityIds
//         AND Active__c = true
//     ];

//     if (staffFacilities.isEmpty()) {
//         return new List<Map<String,Object>>();
//     }

//     Set<Id> staffIds = new Set<Id>();
//     Set<String> staffEmails = new Set<String>();

//     // 🔥 FIXED → MULTI FACILITY SUPPORT
//     Map<Id, Set<String>> staffFacilityMap =
//         new Map<Id, Set<String>>();

//     Map<Id,String> staffDisplayNameMap = new Map<Id,String>();
//     Map<Id,String> staffPictureMap = new Map<Id,String>();
//     Map<Id,String> staffEmailMap = new Map<Id,String>();

//     for (Staff_Facility__c sf : staffFacilities) {

//         staffIds.add(sf.Staff__c);

//         // ----------------------------------
//         // MULTI FACILITY ACCUMULATION
//         // ----------------------------------

//         if (!staffFacilityMap.containsKey(sf.Staff__c)) {
//             staffFacilityMap.put(
//                 sf.Staff__c,
//                 new Set<String>()
//             );
//         }

//         staffFacilityMap
//             .get(sf.Staff__c)
//             .add(sf.Facility__r.Name);

//         staffDisplayNameMap.put(
//             sf.Staff__c,
//             sf.Staff__r.NameToDisplay__c
//         );

//         staffPictureMap.put(
//             sf.Staff__c,
//             sf.Staff__r.Picture__c
//         );

//         // 🔥 collect email for user matching
//         if (sf.Staff__r.Email_Address__c != null) {

//             String email =
//                 sf.Staff__r.Email_Address__c.toLowerCase();

//             staffEmails.add(email);
//             staffEmailMap.put(sf.Staff__c, email);
//         }
//     }

//     // ----------------------------------
//     // USER EMAIL MATCH FILTER
//     // ----------------------------------

//     Set<String> validUserEmails = new Set<String>();

//     if (!staffEmails.isEmpty()) {

//         for (User u : [
//             SELECT Id, Email
//             FROM User
//             WHERE Email IN :staffEmails
//             AND IsActive = true
//         ]) {

//             if (u.Email != null) {
//                 validUserEmails.add(
//                     u.Email.toLowerCase()
//                 );
//             }
//         }
//     }

//     // keep only matching staff
//     Set<Id> filteredStaffIds = new Set<Id>();

//     for (Id sid : staffIds) {

//         String email = staffEmailMap.get(sid);

//         if (email != null &&
//             validUserEmails.contains(email)) {

//             filteredStaffIds.add(sid);
//         }
//     }

//     staffIds = filteredStaffIds;

//     if (staffIds.isEmpty()) {
//         return new List<Map<String,Object>>();
//     }

//     // ----------------------------------
//     // LOAD ROLES
//     // ----------------------------------

//     Map<Id, Set<String>> staffRoleMap =
//         new Map<Id, Set<String>>();

//     List<StaffRole__c> roles = [
//     SELECT
//         StaffRole_To_Staff__c,
//         RoleName__c,
//         Facility__c
//     FROM StaffRole__c
//     WHERE StaffRole_To_Staff__c IN :staffIds
//     AND RoleName__c != null
//     AND Facility__c IN :facilityIds
//     ];


//     for (StaffRole__c r : roles) {

//         if (!staffRoleMap.containsKey(
//             r.StaffRole_To_Staff__c
//         )) {
//             staffRoleMap.put(
//                 r.StaffRole_To_Staff__c,
//                 new Set<String>()
//             );
//         }

//         staffRoleMap
//             .get(r.StaffRole_To_Staff__c)
//             .add(r.RoleName__c);
//     }

//     // ----------------------------------
//     // OPTIONAL ROLE FILTER
//     // ----------------------------------

//     if (roleNames != null && !roleNames.isEmpty()) {

//         Set<Id> allowed = new Set<Id>();

//         for (Id staffId : staffRoleMap.keySet()) {

//             Set<String> roleSet =
//                 staffRoleMap.get(staffId);

//             for (String r : roleSet) {

//                 if (roleNames.contains(r)) {
//                     allowed.add(staffId);
//                     break;
//                 }
//             }
//         }

//         staffIds.retainAll(allowed);
//     }

//     if (staffIds.isEmpty()) {
//         return new List<Map<String,Object>>();
//     }

//     // ----------------------------------
//     // Final Staff Query
//     // ----------------------------------

//     List<Staff__c> staff = [
//         SELECT
//             Id,
//             NameToDisplay__c,
//             Picture__c,
//             Accessible_Custom_Forms__c
//         FROM Staff__c
//         WHERE Id IN :staffIds
//         AND Status__c = TRUE
//     ];

//     // ----------------------------------
//     // Build Output
//     // ----------------------------------

//     List<Map<String,Object>> output =
//         new List<Map<String,Object>>();

//     for (Staff__c s : staff) {

//         String roleString = '';

//         if (staffRoleMap.containsKey(s.Id)) {
//             roleString =
//                 String.join(
//                     new List<String>(
//                         staffRoleMap.get(s.Id)
//                     ),
//                     ', '
//                 );
//         }

//         // 🔥 JOIN ALL FACILITIES
//         String facilityString = '';

//         if (staffFacilityMap.containsKey(s.Id)) {
//             facilityString =
//                 String.join(
//                     new List<String>(
//                         staffFacilityMap.get(s.Id)
//                     ),
//                     '\n'
//                 );

//         }

//         output.add(new Map<String,Object>{
//             'Id' => s.Id,
//             'Name' => s.NameToDisplay__c,
//             'Picture__c' => s.Picture__c,
//             'Role' => roleString,
//             'FacilityName' => facilityString,

//             // LWC preselection support
//             'Accessible_Custom_Forms__c' =>
//                 s.Accessible_Custom_Forms__c
//         });
//     }

//     return output;
// }

@AuraEnabled
public static List<Map<String,Object>> getStaffForAssign(
    List<Id> facilityIds,
    List<String> roleNames,
    Id orgId
) {

    // ==================================================
    // Staff ↔ Facility  (ORG FILTER APPLIED HERE)
    // ==================================================

    List<Staff_Facility__c> staffFacilities = [
        SELECT
            Staff__c,
            Staff__r.NameToDisplay__c,
            Staff__r.Picture__c,
            Staff__r.Email_Address__c,
            Facility__c,
            Facility__r.Name,
            Facility__r.Organisation__c
        FROM Staff_Facility__c
        WHERE Facility__c IN :facilityIds
        AND Active__c = true
        AND Facility__r.Organisation__c = :orgId
    ];

    if (staffFacilities.isEmpty()) {
        return new List<Map<String,Object>>();
    }

    Set<Id> staffIds = new Set<Id>();
    Set<String> staffEmails = new Set<String>();

    Map<Id, Set<String>> staffFacilityMap =
        new Map<Id, Set<String>>();

    Map<Id,String> staffEmailMap =
        new Map<Id,String>();

    for (Staff_Facility__c sf : staffFacilities) {

        staffIds.add(sf.Staff__c);

        if (!staffFacilityMap.containsKey(sf.Staff__c)) {
            staffFacilityMap.put(
                sf.Staff__c,
                new Set<String>()
            );
        }

        staffFacilityMap.get(sf.Staff__c)
            .add(sf.Facility__r.Name);

        if (sf.Staff__r.Email_Address__c != null) {

            String email =
                sf.Staff__r.Email_Address__c.toLowerCase();

            staffEmails.add(email);
            staffEmailMap.put(sf.Staff__c, email);
        }
    }

    // ==================================================
    // USER EMAIL MATCH FILTER
    // ==================================================

    Set<String> validUserEmails = new Set<String>();

    if (!staffEmails.isEmpty()) {

        for (User u : [
            SELECT Id, Email
            FROM User
            WHERE Email IN :staffEmails
            AND IsActive = true
        ]) {
            if (u.Email != null) {
                validUserEmails.add(u.Email.toLowerCase());
            }
        }
    }

    Set<Id> filteredStaffIds = new Set<Id>();

    for (Id sid : staffIds) {

        String email = staffEmailMap.get(sid);

        if (email != null &&
            validUserEmails.contains(email)) {

            filteredStaffIds.add(sid);
        }
    }

    staffIds = filteredStaffIds;

    if (staffIds.isEmpty()) {
        return new List<Map<String,Object>>();
    }

    // ==================================================
    // LOAD ROLES
    // ==================================================

    Map<Id, Map<Id, Set<String>>> staffFacilityRoleMap =
        new Map<Id, Map<Id, Set<String>>>();

    for (StaffRole__c r : [
        SELECT
            StaffRole_To_Staff__c,
            RoleName__c,
            Facility__c
        FROM StaffRole__c
        WHERE StaffRole_To_Staff__c IN :staffIds
        AND RoleName__c != null
        AND Facility__c IN :facilityIds
        AND Active__c = true
    ]) {

        if (!staffFacilityRoleMap.containsKey(r.StaffRole_To_Staff__c)) {
            staffFacilityRoleMap.put(
                r.StaffRole_To_Staff__c,
                new Map<Id, Set<String>>()
            );
        }

        if (!staffFacilityRoleMap
                .get(r.StaffRole_To_Staff__c)
                .containsKey(r.Facility__c)) {

            staffFacilityRoleMap
                .get(r.StaffRole_To_Staff__c)
                .put(r.Facility__c, new Set<String>());
        }

        staffFacilityRoleMap
            .get(r.StaffRole_To_Staff__c)
            .get(r.Facility__c)
            .add(r.RoleName__c);
    }

    // ==================================================
    // OPTIONAL ROLE FILTER
    // ==================================================

    if (roleNames != null && !roleNames.isEmpty()) {

        Set<Id> allowed = new Set<Id>();

        for (Id sid : staffFacilityRoleMap.keySet()) {

            for (Id fid :
                 staffFacilityRoleMap.get(sid).keySet()) {

                for (String role :
                     staffFacilityRoleMap.get(sid).get(fid)) {

                    if (roleNames.contains(role)) {
                        allowed.add(sid);
                        break;
                    }
                }
            }
        }

        staffIds.retainAll(allowed);
    }

    if (staffIds.isEmpty()) {
        return new List<Map<String,Object>>();
    }

    // ==================================================
    // FINAL STAFF QUERY (NO ORG FILTER HERE)
    // ==================================================

    List<Staff__c> staff = [
        SELECT
            Id,
            NameToDisplay__c,
            Picture__c,
            Accessible_Custom_Forms__c
        FROM Staff__c
        WHERE Id IN :staffIds
        AND Status__c = TRUE
    ];

    // ==================================================
    // BUILD OUTPUT
    // ==================================================

    List<Map<String,Object>> output =
        new List<Map<String,Object>>();

    for (Staff__c s : staff) {

        Set<String> mergedRoles = new Set<String>();

        if (staffFacilityRoleMap.containsKey(s.Id)) {

            for (Id fid : facilityIds) {

                if (staffFacilityRoleMap
                        .get(s.Id)
                        .containsKey(fid)) {

                    mergedRoles.addAll(
                        staffFacilityRoleMap
                            .get(s.Id)
                            .get(fid)
                    );
                }
            }
        }

        output.add(new Map<String,Object>{
            'Id' => s.Id,
            'Name' => s.NameToDisplay__c,
            'Picture__c' => s.Picture__c,
            'Role' => String.join(new List<String>(mergedRoles), ', '),
            'FacilityName' =>
                staffFacilityMap.containsKey(s.Id)
                    ? String.join(
                        new List<String>(
                            staffFacilityMap.get(s.Id)
                        ),
                        '\n'
                      )
                    : '',
            'Accessible_Custom_Forms__c' =>
                s.Accessible_Custom_Forms__c
        });
    }

    return output;
}







@AuraEnabled
public static void grantAccessToParticipantsBulk(
    List<Id> allParticipantIds,
    List<Id> selectedParticipantIds,
    List<String> formIds,
    Boolean appendOnly
) {

    if (allParticipantIds == null || allParticipantIds.isEmpty()) {
        throw new AuraHandledException('No participant IDs provided.');
    }

    if (formIds == null || formIds.isEmpty()) {
        throw new AuraHandledException('No form IDs provided.');
    }

    if (appendOnly == null) {
        appendOnly = false;
    }

    Set<Id> selectedSet =
        new Set<Id>(selectedParticipantIds);

    List<Client__c> participants = [
        SELECT Id, Accessible_Forms__c
        FROM Client__c
        WHERE Id IN :allParticipantIds
    ];

    for (Client__c p : participants) {

        Set<String> existing = new Set<String>();

        if (String.isNotBlank(p.Accessible_Forms__c)) {
            existing.addAll(
                p.Accessible_Forms__c.split('[;\\n\\r]+')
            );
        }

        // =====================================
        // MODE LOGIC
        // =====================================

        if (selectedSet.contains(p.Id)) {

            // ALWAYS ADD
            existing.addAll(formIds);

        } else if (!appendOnly) {

            // REMOVE ONLY in sync mode
            existing.removeAll(formIds);
        }

        p.Accessible_Forms__c =
            String.join(
                new List<String>(existing),
                '\n'
            );
    }

    update participants;
    recalcAssignment(
    new Set<String>(formIds),
    allParticipantIds,
    null
);
}



@AuraEnabled
public static void grantAccessToStaffBulk(
    List<Id> allStaffIds,
    List<Id> selectedStaffIds,
    List<String> formIds,
    Boolean appendOnly
) {

    if (allStaffIds == null || allStaffIds.isEmpty()) {
        throw new AuraHandledException('No staff IDs provided.');
    }

    if (formIds == null || formIds.isEmpty()) {
        throw new AuraHandledException('No form IDs provided.');
    }

    if (appendOnly == null) {
        appendOnly = false;
    }

    Set<Id> selectedSet =
        new Set<Id>(selectedStaffIds);

    List<Staff__c> staff = [
        SELECT Id, Accessible_Custom_Forms__c
        FROM Staff__c
        WHERE Id IN :allStaffIds
    ];

    for (Staff__c s : staff) {

        Set<String> existing = new Set<String>();

        if (String.isNotBlank(s.Accessible_Custom_Forms__c)) {
            existing.addAll(
                s.Accessible_Custom_Forms__c.split('[;\\n\\r]+')
            );
        }

        // =====================================
        // MODE LOGIC
        // =====================================

        if (selectedSet.contains(s.Id)) {

            // ALWAYS ADD
            existing.addAll(formIds);

        } else if (!appendOnly) {

            // REMOVE ONLY in sync mode
            existing.removeAll(formIds);
        }

        s.Accessible_Custom_Forms__c =
            String.join(
                new List<String>(existing),
                '\n'
            );
    }

    update staff;
    recalcAssignment(
    new Set<String>(formIds),
    null,
    allStaffIds
);
}

private static void recalcAssignment(
    Set<String> formIds,
    List<Id> participantIds,
    List<Id> staffIds
) {

    if (formIds == null || formIds.isEmpty()) return;

    Set<String> assignedFormIds = new Set<String>();

    // 🔹 Participants (LIMITED)
    if (participantIds != null && !participantIds.isEmpty()) {
        for (Client__c c : [
            SELECT Accessible_Forms__c
            FROM Client__c
            WHERE Id IN :participantIds
        ]) {

            if (String.isBlank(c.Accessible_Forms__c)) continue;

            for (String id : c.Accessible_Forms__c.split('[;\\n\\r]+')) {
                assignedFormIds.add(id.trim());
            }
        }
    }

    // 🔹 Staff (LIMITED)
    if (staffIds != null && !staffIds.isEmpty()) {
        for (Staff__c s : [
            SELECT Accessible_Custom_Forms__c
            FROM Staff__c
            WHERE Id IN :staffIds
        ]) {

            if (String.isBlank(s.Accessible_Custom_Forms__c)) continue;

            for (String id : s.Accessible_Custom_Forms__c.split('[;\\n\\r]+')) {
                assignedFormIds.add(id.trim());
            }
        }
    }

    // -----------------------------------
    // Update Dynamic Forms
    // -----------------------------------
    List<Dynamic_Form__c> updates = new List<Dynamic_Form__c>();

    for (Dynamic_Form__c form : [
        SELECT Id, Is_Assigned__c
        FROM Dynamic_Form__c
        WHERE Id IN :formIds
    ]) {

        Boolean shouldBeAssigned =
            assignedFormIds.contains(form.Id);

        if (form.Is_Assigned__c != shouldBeAssigned) {
            form.Is_Assigned__c = shouldBeAssigned;
            updates.add(form);
        }
    }

    if (!updates.isEmpty()) {
        update updates;
    }
}


@AuraEnabled
public static LayoutWrapper getDynamicFormData(Id recordId) {

    try {

        Dynamic_Form__c formRecord = [
            SELECT Id,
                   Name__c,
                   Form_JSON__c,
                   Form_Type__c,
                   Org_Id__c,
                   Audience__c,
                   Form_Group_Id__c,
                   Version_Label__c
            FROM Dynamic_Form__c
            WHERE Id = :recordId
            LIMIT 1
        ];

        LayoutWrapper wrapper = new LayoutWrapper();

        // ============================
        // EXISTING FIELDS (unchanged)
        // ============================
        wrapper.layoutName  = formRecord.Id;
        wrapper.displayName = formRecord.Name__c;
        wrapper.layoutJson  = formRecord.Form_JSON__c;
        wrapper.title       = formRecord.Name__c;
        wrapper.formModule  = formRecord.Form_Type__c;
        wrapper.isDefault   = false;
        wrapper.audience    = formRecord.Audience__c;

        // ============================
        // 🔥 NEW FIELDS (IMPORTANT)
        // ============================
        wrapper.formGroupId  = formRecord.Form_Group_Id__c;
        wrapper.versionLabel = formRecord.Version_Label__c;

        return wrapper;

    } catch (Exception e) {
        throw new AuraHandledException(
            'Failed to retrieve dynamic form data: ' + e.getMessage()
        );
    }
}

@AuraEnabled
public static void deleteDynamicForm(Id recordId) {

    System.debug('Attempting to delete Dynamic Form with Id: ' + recordId);

    if (recordId == null) {
        throw new AuraHandledException('No record id provided for deletion');
    }

    try {

        Dynamic_Form__c form = [
            SELECT Id,
                   Form_JSON__c
            FROM Dynamic_Form__c
            WHERE Id = :recordId
            LIMIT 1
        ];

        // ============================
        // 🔥 AWS DELETE (if applicable)
        // ============================
        if (!String.isBlank(form.Form_JSON__c)) {

            try {

                Map<String, Object> awsMeta =
                    (Map<String, Object>)
                        JSON.deserializeUntyped(form.Form_JSON__c);

                if (
                    awsMeta != null &&
                    awsMeta.containsKey('bucket') &&
                    awsMeta.containsKey('key')
                ) {

                    String bucket = (String) awsMeta.get('bucket');
                    String keyVal = (String) awsMeta.get('key');

                    System.debug('🗑️ Deleting AWS JSON: bucket=' + bucket + ', key=' + keyVal);

                    WordEditorController.deleteFromAws(bucket, keyVal);

                } else {
                    System.debug('⚠️ No AWS metadata found — skipping AWS delete.');
                }

            } catch (Exception awsEx) {

                System.debug('⚠️ AWS delete skipped: ' + awsEx.getMessage());
                // Don't block SF delete
            }
        }

        // ============================
        // 🗑️ Salesforce delete
        // ============================
        delete form;

        System.debug('Dynamic Form deleted successfully: ' + recordId);

    } catch (Exception e) {

        System.debug('Exception in deleteDynamicForm: ' + e.getMessage());

        throw new AuraHandledException(
            'Failed to delete form: ' + e.getMessage()
        );
    }
}

@AuraEnabled
public static Map<String, Object> saveFormWithVersion(
    Id recordId,
    String formName,
    String formJson,
    String formType,
    String orgId,
    String audience,
    String formGroupId,
    Boolean isVersionEditFlow
) {
    Map<String, Object> result = new Map<String, Object>();

    // ============================
    // 🟢 NEW FORM
    // ============================
    if (String.isBlank(formGroupId)) {

        // 🔥 FIX: Check duplicate ONLY for true new form
        if (!isVersionEditFlow) {

            List<Dynamic_Form__c> existing = [
                SELECT Id 
                FROM Dynamic_Form__c
                WHERE Name__c = :formName
                AND Form_Group_Id__c != NULL 
                LIMIT 1
            ];

            if (!existing.isEmpty()) {
                throw new AuraHandledException('Form name already exists.');
            }
        }

        // ============================
        // 🔥 CLEAN FORM NAME
        // ============================
        String cleanName = formName != null 
            ? formName.replaceAll('[^a-zA-Z0-9]', '') 
            : 'Form';

        // ============================
        // 🔥 CURRENT TIME
        // ============================
        Datetime nowDT = System.now();

        // ============================
        // 🔥 UNIQUE TIMESTAMP
        // ============================
        String millis = String.valueOf(nowDT.getTime());

        // ============================
        // 🔥 FINAL GROUP ID
        // ============================
        String newGroupId = cleanName + '_' + millis;

        Dynamic_Form__c form = new Dynamic_Form__c(
            Name__c = formName,
            Form_JSON__c = formJson,
            Form_Type__c = formType,
            Org_Id__c = orgId,
            Audience__c = audience,
            Form_Group_Id__c = newGroupId,
            Version_Label__c = 'v1',
            Is_Assigned__c = false
        );

        insert form;

        result.put('recordId', form.Id);
        result.put('formGroupId', newGroupId);
        result.put('versionLabel', 'v1');
    }

    // ============================
    // 🟡 EDIT → NEW VERSION
    // ============================
    else {

        List<Dynamic_Form__c> versions = [
            SELECT Version_Label__c
            FROM Dynamic_Form__c
            WHERE Form_Group_Id__c = :formGroupId
        ];

        Integer maxVersion = 0;

        for (Dynamic_Form__c v : versions) {
            if (v.Version_Label__c != null && v.Version_Label__c.startsWith('v')) {
                Integer num = Integer.valueOf(v.Version_Label__c.replace('v',''));
                if (num > maxVersion) {
                    maxVersion = num;
                }
            }
        }

        Integer newVersionNumber = maxVersion + 1;
        String newVersionLabel = 'v' + newVersionNumber;

        Dynamic_Form__c form = new Dynamic_Form__c(
            Name__c = formName,
            Form_JSON__c = formJson,
            Form_Type__c = formType,
            Org_Id__c = orgId,
            Audience__c = audience,
            Form_Group_Id__c = formGroupId,
            Version_Label__c = newVersionLabel,
            Is_Assigned__c = false
        );

        insert form;

        result.put('recordId', form.Id);
        result.put('formGroupId', formGroupId);
        result.put('versionLabel', newVersionLabel);
    }

    return result;
}

}