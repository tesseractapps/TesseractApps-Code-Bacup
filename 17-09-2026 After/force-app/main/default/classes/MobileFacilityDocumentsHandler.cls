@RestResource(urlMapping='/facilityDocumentsAPI/*')
global class MobileFacilityDocumentsHandler {    
    
    @HttpGet
    global static void getFacilityDocuments() {

        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        Map<String, Object> responseMap = new Map<String, Object>();

        try {

            // GET currentDocumentId FROM QUERY PARAMETER
            String currentDocumentIdParam = req.params.get('currentDocumentId');
            
            // Convert empty string to null for Id parameter
            Id currentDocumentId = null;
            if (String.isNotBlank(currentDocumentIdParam)) {
                try {
                    currentDocumentId = (Id)currentDocumentIdParam;
                } catch (Exception e) {
                    currentDocumentId = null;
                }
            }
            
            String userEmail = UserInfo.getUserEmail();

            // 1️⃣ GET STAFF RECORD
            List<Staff__c> staffList = [
                SELECT Id
                FROM Staff__c
                WHERE Email_Address__c = :userEmail
                LIMIT 1
            ];

            if (staffList.isEmpty()) {
                responseMap.put('success', false);
                responseMap.put('message', 'Staff record not found for email: ' + userEmail);
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            Staff__c staff = staffList[0];
            Id staffId = staff.Id;

            // 2️⃣ GET ACTIVE FACILITIES FOR THIS STAFF
            List<Staff_Facility__c> staffFacilities = [
                SELECT Id, Facility__c, Facility__r.Organisation__c, Active__c
                FROM Staff_Facility__c
                WHERE Staff__c = :staffId
                AND Active__c = TRUE
            ];

            if (staffFacilities.isEmpty()) {
                responseMap.put('success', false);
                responseMap.put('message', 'No active facilities found for staff');
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
                return;
            }

            // 3️⃣ BUILD FACILITY ID LIST
            List<String> facilityIdList = new List<String>();
            Id organisationId = null;
            
            for (Staff_Facility__c sf : staffFacilities) {
                if (sf.Facility__c != null) {
                    facilityIdList.add(sf.Facility__c);
                }
                // Get organisation from first facility (assuming all facilities belong to same org)
                if (organisationId == null && sf.Facility__r.Organisation__c != null) {
                    organisationId = sf.Facility__r.Organisation__c;
                }
            }

            System.debug('Facility IDs: ' + facilityIdList);
            System.debug('Organisation ID: ' + organisationId);
            System.debug('Staff ID: ' + staffId);

            // 4️⃣ CALL THE SAME METHOD AS LWC - getFacilityIdentityDocuments
            List<Map<String, Object>> allDocuments = 
                FacilityDocumentController.getFacilityIdentityDocuments(
                    facilityIdList, 
                    staffId, 
                    currentDocumentId
                );

            System.debug('========== DOCUMENTS FROM getFacilityIdentityDocuments ==========');
            System.debug('Total documents: ' + allDocuments.size());
            
            for(Map<String, Object> doc : allDocuments) {
                System.debug('Doc: ' + doc.get('name') + 
                           ' | Category: ' + doc.get('complianceCategory') + 
                           ' | Type: ' + doc.get('category'));
            }

            // ------------------------------------------------------
            // CATEGORIZE DOCUMENTS FOR MOBILE RESPONSE
            // ------------------------------------------------------
            
            // Category Maps
            Map<String, List<Map<String,Object>>> categoryMap = new Map<String, List<Map<String,Object>>>{
                'primary-dynamic' => new List<Map<String,Object>>(),
                'secondary-dynamic' => new List<Map<String,Object>>(),
                'other-identity-dynamic' => new List<Map<String,Object>>(),
                'documents-dynamic' => new List<Map<String,Object>>(),
                'training-dynamic' => new List<Map<String,Object>>(),
                'primary-static' => new List<Map<String,Object>>(),
                'secondary-static' => new List<Map<String,Object>>()
            };

            // Process documents from getFacilityIdentityDocuments
            for (Map<String, Object> doc : allDocuments) {
                
                String complianceCategory = (String)doc.get('complianceCategory');
                String category = (String)doc.get('category');
                Boolean isDefault = doc.containsKey('isDefault') ? (Boolean)doc.get('isDefault') : false;
                String docName = (String)doc.get('name');
                Integer points = doc.containsKey('points') ? (Integer)doc.get('points') : 0;
                Boolean expiryRequired = doc.containsKey('expiryRequired') ? (Boolean)doc.get('expiryRequired') : false;
                
                // Skip if no document name
                if (String.isBlank(docName)) {
                    continue;
                }
                
     
               Boolean mandatory = doc.containsKey('mandatory')
                    ? (Boolean)doc.get('mandatory')
                    : false;
                
                String label = docName;
                
                if (mandatory) {
                    label += ' *';
                }
                
                if (points > 0) {
                    label += ' (' + String.valueOf(points) + 'pts)';
                }
                                
                // Build leaf node
                Map<String,Object> leaf = new Map<String,Object>{
                    'id' => generateId(docName),
                    'label' => label,
                    'value' => docName,
                    'points' => points,
                    'expiryRequired' => expiryRequired != null ? expiryRequired : false,
                    'children' => new List<Object>()
                };
                
                // Add flags based on isDefault
                if(isDefault != null && isDefault) {
                    leaf.put('isStatic', true);
                } else {
                    leaf.put('isDynamic', true);
                }
                
                System.debug('Processing document: ' + docName + 
                           ' | complianceCategory: ' + complianceCategory + 
                           ' | category: ' + category +
                           ' | isDefault: ' + isDefault);
                
                // Categorize by compliance category and document type
                if('Identity'.equals(complianceCategory)) {
                    if('Primary'.equals(category)) {
                        if(isDefault != null && isDefault) {
                            categoryMap.get('primary-static').add(leaf);
                        } else {
                            categoryMap.get('primary-dynamic').add(leaf);
                        }
                    } else if('Secondary'.equals(category)) {
                        if(isDefault != null && isDefault) {
                            categoryMap.get('secondary-static').add(leaf);
                        } else {
                            categoryMap.get('secondary-dynamic').add(leaf);
                        }
                    } else {
                        categoryMap.get('other-identity-dynamic').add(leaf);
                    }
                }
                else if('Documents'.equals(complianceCategory)) {
                    categoryMap.get('documents-dynamic').add(leaf);
                }
                else if('Trainings'.equals(complianceCategory)) {
                    categoryMap.get('training-dynamic').add(leaf);
                    System.debug('✅ Added Training document: ' + docName);
                }
                else {
                    // Default: treat as Documents
                    categoryMap.get('documents-dynamic').add(leaf);
                }
            }

            // DEBUG: Check counts
            System.debug('========== CATEGORY COUNTS ==========');
            System.debug('Training documents count: ' + categoryMap.get('training-dynamic').size());
            System.debug('Documents count: ' + categoryMap.get('documents-dynamic').size());
            System.debug('Primary Identity count: ' + categoryMap.get('primary-dynamic').size() + ' (dynamic) + ' + categoryMap.get('primary-static').size() + ' (static)');
            System.debug('Secondary Identity count: ' + categoryMap.get('secondary-dynamic').size() + ' (dynamic) + ' + categoryMap.get('secondary-static').size() + ' (static)');
            System.debug('Other Identity count: ' + categoryMap.get('other-identity-dynamic').size());

            // ------------------------------------------------------
            // Combine Primary & Secondary (Static + Dynamic)
            // ------------------------------------------------------
            List<Map<String,Object>> allPrimaryDocs = new List<Map<String,Object>>();
            allPrimaryDocs.addAll(categoryMap.get('primary-dynamic'));
            allPrimaryDocs.addAll(categoryMap.get('primary-static'));

            List<Map<String,Object>> allSecondaryDocs = new List<Map<String,Object>>();
            allSecondaryDocs.addAll(categoryMap.get('secondary-dynamic'));
            allSecondaryDocs.addAll(categoryMap.get('secondary-static'));

            // ------------------------------------------------------
            // Build Mobile Response Structure
            // ------------------------------------------------------
            List<Map<String,Object>> dynamicDocumentTypes = new List<Map<String,Object>>();

            // 100 Points of ID Section
            List<Object> idChildren = new List<Object>();
            idChildren.add(buildSection('primary-id','Primary Identity Documents', allPrimaryDocs));
            idChildren.add(buildSection('secondary-id','Secondary Identity Documents', allSecondaryDocs));
            idChildren.add(buildSection('other-identity','Other Identity Documents',
                categoryMap.get('other-identity-dynamic')));
            
            dynamicDocumentTypes.add(new Map<String,Object>{
                'id' => '100-points-id',
                'label' => '100 Points of ID',
                'value' => '100-points-id',
                'children' => idChildren
            });

            // Documents Section
            Map<String,Object> documentsSection = new Map<String,Object>{
                'id' => 'documents',
                'label' => 'Documents',
                'value' => 'documents'
            };
            
            if (categoryMap.get('documents-dynamic').isEmpty()) {
                documentsSection.put('children', buildEmpty('No Documents Available'));
            } else {
                documentsSection.put('children', categoryMap.get('documents-dynamic'));
            }
            dynamicDocumentTypes.add(documentsSection);

            // Training Documents Section
            Map<String,Object> trainingSection = new Map<String,Object>{
                'id' => 'training-docs',
                'label' => 'Training Documents',
                'value' => 'training-docs'
            };
            
            if (categoryMap.get('training-dynamic').isEmpty()) {
                trainingSection.put('children', buildEmpty('No Training Documents Available'));
            } else {
                trainingSection.put('children', categoryMap.get('training-dynamic'));
            }
            dynamicDocumentTypes.add(trainingSection);

            // ------------------------------------------------------
            // Send Response
            // ------------------------------------------------------
            responseMap.put('success', true);
            responseMap.put('dynamicDocumentTypes', dynamicDocumentTypes);
            
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));

        } catch (Exception e) {
            System.debug('ERROR in getFacilityDocuments: ' + e.getMessage());
            System.debug('Stack trace: ' + e.getStackTraceString());
            
            String errorMessage = e.getMessage();
            if (errorMessage != null && errorMessage.length() > 200) {
                errorMessage = errorMessage.substring(0, 200) + '...';
            }
            
            responseMap.put('success', false);
            responseMap.put('message', errorMessage);
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(responseMap));
        }
    }
    
    // ============================================================
    // HELPER METHODS
    // ============================================================
    
    private static Map<String,Object> buildSection(String id, String label, List<Map<String,Object>> children) {
        Map<String,Object> section = new Map<String,Object>{
            'id' => id,
            'label' => label,
            'value' => id
        };
        
        if (children == null || children.isEmpty()) {
            section.put('children', buildEmpty('No Documents Available'));
        } else {
            section.put('children', children);
        }
        
        return section;
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
        if (String.isBlank(name)) return 'empty';
        return name.toLowerCase().replaceAll('[^a-z0-9]+','-');
    }
}