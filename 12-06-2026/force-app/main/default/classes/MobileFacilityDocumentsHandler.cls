@RestResource(urlMapping='/facilityDocumentsAPI/*')
global class MobileFacilityDocumentsHandler {    
    @HttpGet
	global static void getFacilityDocuments() {

    RestResponse res = RestContext.response;
    Map<String, Object> responseMap = new Map<String, Object>();

    try {

        String userEmail = UserInfo.getUserEmail();

        List<Staff__c> staffList = [
            SELECT Id, Facility__c,
                (SELECT RoleName__c
                 FROM StaffRoles__r
                 WHERE Active__c = TRUE)
            FROM Staff__c
            WHERE Email_Address__c = :userEmail
            LIMIT 1
        ];

        if (staffList.isEmpty() || staffList[0].Facility__c == null) {
            responseMap.put('success', false);
            responseMap.put('message', 'Staff or Facility not found');
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
            return;
        }

        Staff__c staff = staffList[0];
        Id facilityId = staff.Facility__c;

        // ------------------------------------------------------
        // Staff Roles
        // ------------------------------------------------------
        Set<String> staffRoles = new Set<String>();
        for (StaffRole__c sr : staff.StaffRoles__r) {
            if (String.isNotBlank(sr.RoleName__c)) {
                staffRoles.add(sr.RoleName__c.trim().toLowerCase());
            }
        }

        // ------------------------------------------------------
        // Dynamic Documents
        // ------------------------------------------------------
        List<Facility_Compliance_Setting__c> docs = [
            SELECT Document_Name__c,
                   Compliance_Category__c,
                   Identity_Category__c,
                   Documents_Category__c,
                   Training_Category__c,
                   Identity_Points__c,
                   X100_pointcheck__c,
                   Mandatory_Document__c,
                   Expiry_Date_Required__c,
                   Roles__c
            FROM Facility_Compliance_Setting__c
            WHERE Facility__c = :facilityId
              AND Visible_to_Staff__c = TRUE
              AND Compliance_Category__c IN ('Identity','Documents','Trainings')
        ];

        // ------------------------------------------------------
        // Static Documents
        // ------------------------------------------------------
        List<Map<String, Object>> staticDocs =
            FacilityDocumentController.getDefault100PointsDocuments();

        // ------------------------------------------------------
        // Category Maps
        // ------------------------------------------------------
        Map<String, List<Map<String,Object>>> categoryMap = new Map<String, List<Map<String,Object>>>{
            'primary-dynamic' => new List<Map<String,Object>>(),
            'secondary-dynamic' => new List<Map<String,Object>>(),
            'other-identity-dynamic' => new List<Map<String,Object>>(),
            'documents-dynamic' => new List<Map<String,Object>>(),
            'training-dynamic' => new List<Map<String,Object>>()
        };

        Map<String, List<Map<String,Object>>> staticCategoryMap = new Map<String, List<Map<String,Object>>>{
            'primary-static' => new List<Map<String,Object>>(),
            'secondary-static' => new List<Map<String,Object>>()
        };

        // ------------------------------------------------------
        // Process Dynamic Docs
        // ------------------------------------------------------
        for (Facility_Compliance_Setting__c d : docs) {

            // Role filtering
            if (String.isNotBlank(d.Roles__c)) {
                Boolean match = false;
                for (String r : d.Roles__c.split(';')) {
                    if (staffRoles.contains(r.trim().toLowerCase())) {
                        match = true;
                        break;
                    }
                }
                if (!match) continue;
            }

            Map<String,Object> leaf = new Map<String,Object>{
                'id' => generateId(d.Document_Name__c),
                'label' => buildLabel(d),
                'value' => d.Document_Name__c,
                'points' => extractPoints(d),
                'expiryRequired' => d.Expiry_Date_Required__c, // ✅ FIXED
                'isDynamic' => true,
                'children' => new List<Object>()
            };

            if (d.Compliance_Category__c == 'Identity') {
                if (d.Identity_Category__c == 'Primary') {
                    categoryMap.get('primary-dynamic').add(leaf);
                } else if (d.Identity_Category__c == 'Secondary') {
                    categoryMap.get('secondary-dynamic').add(leaf);
                } else {
                    categoryMap.get('other-identity-dynamic').add(leaf);
                }
            }
            else if (d.Compliance_Category__c == 'Documents') {
                categoryMap.get('documents-dynamic').add(leaf);
            }
            else if (d.Compliance_Category__c == 'Trainings') {
                categoryMap.get('training-dynamic').add(leaf);
            }
        }

        // ------------------------------------------------------
        // Process Static Docs
        // ------------------------------------------------------
        for (Map<String, Object> staticDoc : staticDocs) {

            Map<String,Object> leaf = new Map<String,Object>{
                'id' => generateId((String)staticDoc.get('name')),
                'label' => buildStaticLabel(staticDoc),
                'value' => (String)staticDoc.get('name'),
                'points' => (Integer)staticDoc.get('points'),
                'expiryRequired' => false, // ✅ STATIC SAFE
                'isStatic' => true,
                'children' => new List<Object>()
            };

            String category = (String)staticDoc.get('category');
            if (category == 'Primary') {
                staticCategoryMap.get('primary-static').add(leaf);
            } else if (category == 'Secondary') {
                staticCategoryMap.get('secondary-static').add(leaf);
            }
        }

        // ------------------------------------------------------
        // Combine Primary & Secondary
        // ------------------------------------------------------
        List<Map<String,Object>> allPrimaryDocs = new List<Map<String,Object>>();
        allPrimaryDocs.addAll(categoryMap.get('primary-dynamic'));
        allPrimaryDocs.addAll(staticCategoryMap.get('primary-static'));

        List<Map<String,Object>> allSecondaryDocs = new List<Map<String,Object>>();
        allSecondaryDocs.addAll(categoryMap.get('secondary-dynamic'));
        allSecondaryDocs.addAll(staticCategoryMap.get('secondary-static'));

        // ------------------------------------------------------
        // Build Response Structure
        // ------------------------------------------------------
        List<Map<String,Object>> dynamicDocumentTypes = new List<Map<String,Object>>();

        dynamicDocumentTypes.add(new Map<String,Object>{
            'id' => '100-points-id',
            'label' => '100 Points of ID',
            'value' => '100-points-id',
            'children' => new List<Object>{
                buildSection('primary-id','Primary Identity Documents', allPrimaryDocs),
                buildSection('secondary-id','Secondary Identity Documents', allSecondaryDocs),
                buildSection('other-identity','Other Identity Documents',
                    categoryMap.get('other-identity-dynamic'))
            }
        });

        dynamicDocumentTypes.add(new Map<String,Object>{
            'id' => 'documents',
            'label' => 'Documents',
            'value' => 'documents',
            'children' =>
                categoryMap.get('documents-dynamic').isEmpty()
                ? buildEmpty('No Documents Available')
                : categoryMap.get('documents-dynamic')
        });

        dynamicDocumentTypes.add(new Map<String,Object>{
            'id' => 'training-docs',
            'label' => 'Training Documents',
            'value' => 'training-docs',
            'children' =>
                categoryMap.get('training-dynamic').isEmpty()
                ? buildEmpty('No Training Documents Available')
                : categoryMap.get('training-dynamic')
        });

        responseMap.put('success', true);
        responseMap.put('dynamicDocumentTypes', dynamicDocumentTypes);
        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));

    } catch (Exception e) {
        responseMap.put('success', false);
        responseMap.put('message', e.getMessage());
        res.statusCode = 500;
        res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
    }
}
    
    private static Map<String,Object> buildSection(String id, String label, List<Map<String,Object>> children) {
        return new Map<String,Object>{
            'id' => id,
                'label' => label,
                'value' => id,
                'children' => children.isEmpty() ? buildEmpty('No Documents Available') : children
                    };
                        }
    
    private static List<Object> buildEmpty(String label) {
        return new List<Object>{
            new Map<String,Object>{
                'id' => 'empty',
                    'label' => label,
                    'value' => 'empty',
                    'disabled' => true,
                    'children' => new List<Object>()
                    }
        };
            }
    
    private static String generateId(String name) {
        return name.toLowerCase().replaceAll('[^a-z0-9]+','-');
    }
    
    private static Integer extractPoints(Facility_Compliance_Setting__c d) {
        if (d.Identity_Points__c != null) {
            return Integer.valueOf(d.Identity_Points__c);
        }
        
        if (d.X100_pointcheck__c != null) {
            return Integer.valueOf(
                d.X100_pointcheck__c.replaceAll('[^0-9]', '')
            );
        }
        
        return 0;
    }
    
    private static String buildLabel(Facility_Compliance_Setting__c d) {
        Integer pts = extractPoints(d);
        return pts > 0 ? d.Document_Name__c + ' (' + pts + 'pts)' : d.Document_Name__c;
    }
    
    private static String buildStaticLabel(Map<String, Object> staticDoc) {
        Integer pts = (Integer)staticDoc.get('points');
        String name = (String)staticDoc.get('name');
        return pts > 0 ? name + ' (' + pts + 'pts)' : name;
    }
}