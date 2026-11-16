/**
 * Tessa AI Controller
 *
 * Handles authentication between Salesforce users and Tessa AI backend.
 * Uses Named Credential 'Tessa_AI_API' for the API endpoint.
 *
 * The shared secret should be configured on the Named Credential itself
 * via a Custom Header called "X-SF-Secret".
 */
public with sharing class TessaAiController {

 @AuraEnabled(cacheable=false)
    public static String getAuthToken() {
        try {
            // ── Step 1: Get current user ──
            User currentUser = [
                SELECT Id, Name, Email, Username, UserType,
                       User_Role__c,
                       User_Type__c, Type_of_User__c,
                       Organization_Name__c, Full_Name__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            // ── Step 2: Resolve Organisation ──
            Map<String, Object> orgMap = new Map<String, Object>{
                'id'    => '',
                'id_15' => '',
                'name'  => ''
            };

            if (String.isNotBlank(currentUser.Organization_Name__c)) {
                // Organization_Name__c may store org name OR org ID
                String orgField = currentUser.Organization_Name__c.trim();

                // Try by Name first
                List<Organisation__c> orgsByName = [
                    SELECT Id, Name
                    FROM Organisation__c
                    WHERE Name = :orgField
                    LIMIT 1
                ];

                if (!orgsByName.isEmpty()) {
                    orgMap.put('id', orgsByName[0].Id);
                    orgMap.put('id_15', String.valueOf(orgsByName[0].Id).substring(0, 15));
                    orgMap.put('name', orgsByName[0].Name);
                } else {
                    // Try by ID (Organization_Name__c might store 15-char ID)
                    try {
                        List<Organisation__c> orgsById = [
                            SELECT Id, Name
                            FROM Organisation__c
                            WHERE Id = :orgField
                            LIMIT 1
                        ];
                        if (!orgsById.isEmpty()) {
                            orgMap.put('id', orgsById[0].Id);
                            orgMap.put('id_15', String.valueOf(orgsById[0].Id).substring(0, 15));
                            orgMap.put('name', orgsById[0].Name);
                        }
                    } catch (Exception ex) {
                        // Not a valid ID format - ignore
                    }
                }
            }

            // ── Step 3: Resolve Staff Record ──
            String staffId = '';
            String profilePicture = '';

            List<Staff__c> staffRecords = [
                SELECT Id, Email_Address__c, Picture__c,
                       Organization__c, Organization_Name__c
                FROM Staff__c
                WHERE Email_Address__c = :currentUser.Email
                LIMIT 1
            ];

            if (!staffRecords.isEmpty()) {
                staffId = staffRecords[0].Id;
                profilePicture = staffRecords[0].Picture__c;

                // Override org from staff record (more accurate)
                if (staffRecords[0].Organization__c != null) {
                    List<Organisation__c> staffOrg = [SELECT Id, Name FROM Organisation__c WHERE Id = :staffRecords[0].Organization__c LIMIT 1];
                    if (!staffOrg.isEmpty()) {
                        orgMap.put('id', staffOrg[0].Id);
                        orgMap.put('id_15', String.valueOf(staffOrg[0].Id).substring(0, 15));
                        orgMap.put('name', staffOrg[0].Name);
                    }
                }
            }

            // ── Step 4: Resolve Participant Record ──
            String participantId = '';

            if (String.isBlank(staffId)) {
                List<Client__c> participants = [
                    SELECT Id
                    FROM Client__c
                    WHERE Email__c = :currentUser.Email
                    LIMIT 1
                ];
                if (!participants.isEmpty()) {                    participantId = participants[0].Id;
                }
            }

            // ── Step 5a: Resolve Staff Facilities (operational assignments) ──
            List<Map<String, String>> staffFacilitiesList = new List<Map<String, String>>();

            if (String.isNotBlank(staffId)) {
                List<Staff_Facility__c> staffFacilities = [
                    SELECT Facility__c, Facility__r.Name
                    FROM Staff_Facility__c
                    WHERE Staff__c = :staffId
                    AND Active__c = true
                ];

                for (Staff_Facility__c sf : staffFacilities) {
                    Map<String, String> facMap = new Map<String, String>{
                        'id'    => sf.Facility__c,
                        'id_15' => String.valueOf(sf.Facility__c).substring(0, 15),
                        'name'  => sf.Facility__r != null ? sf.Facility__r.Name : ''
                    };
                    staffFacilitiesList.add(facMap);
                }
            }

            // ── Step 5b: Resolve Managed Facilities (authorization scope for managers) ──
            List<Map<String, String>> managedFacilitiesList = new List<Map<String, String>>();

            // Try by User__c first, then by Staff__c
            List<Facility_Association__c> facilityAssociations = new List<Facility_Association__c>();
            try {
                facilityAssociations = [
                    SELECT Facility__c, Facility__r.Name, User_Type__c
                    FROM Facility_Association__c
                    WHERE User__c = :currentUser.Id
                    AND Active__c = true
                ];

                // If no results by User__c, try by Staff__c
                if (facilityAssociations.isEmpty() && String.isNotBlank(staffId)) {
                    facilityAssociations = [
                        SELECT Facility__c, Facility__r.Name, User_Type__c
                        FROM Facility_Association__c
                        WHERE Staff__c = :staffId
                        AND Active__c = true
                    ];
                }
            } catch (Exception ex) {
                // Facility_Association__c may not exist in some orgs - safe to ignore
            }

            for (Facility_Association__c fa : facilityAssociations) {
                Map<String, String> facMap = new Map<String, String>{
                    'id'    => fa.Facility__c,
                    'id_15' => String.valueOf(fa.Facility__c).substring(0, 15),
                    'name'  => fa.Facility__r != null ? fa.Facility__r.Name : ''
                };
                managedFacilitiesList.add(facMap);
            }

            // ── Step 5c: Determine Effective Facility Access ──
                //
                // Business Rules:
                //
                // Level 2 (Managers/Admins)
                // -------------------------
                // Use Facility_Association__c ONLY.
                // Do not merge Staff_Facility__c because it represents
                // operational staff assignment, not authorization.
                //
                // Level 3 (Staff)
                // ---------------
                // If no Facility_Association__c exists,
                // fall back to Staff_Facility__c.
                //
                // Participant users
                // -----------------
                // Participant facilities will be merged later.
                //

                List<Map<String, String>> facilitiesList = new List<Map<String, String>>();

                if (!managedFacilitiesList.isEmpty()) {

                    // Managers/Admins
                    facilitiesList.addAll(managedFacilitiesList);

                } else if (!staffFacilitiesList.isEmpty()) {

                    // Normal Staff
                    facilitiesList.addAll(staffFacilitiesList);

                }

            // ── Step 6: Resolve Facilities for Participant ──
            if (String.isNotBlank(participantId)) {
                List<Participant_Facility__c> partFacilities = new List<Participant_Facility__c>();
                try {
                    partFacilities = [
                        SELECT Facility__c, Facility__r.Name
                        FROM Participant_Facility__c
                        WHERE Participant__c = :participantId
                    ];
                } catch (Exception ex) {
                    // Participant_Facility__c may not exist - safe to ignore
                }

                Set<String> existingFacIds = new Set<String>();
                for (Map<String, String> f : facilitiesList) {
                    existingFacIds.add(f.get('id'));
                }

                for (Participant_Facility__c pf : partFacilities) {
                    if (!existingFacIds.contains(pf.Facility__c)) {
                        Map<String, String> facMap = new Map<String, String>{
                            'id'    => pf.Facility__c,
                            'id_15' => String.valueOf(pf.Facility__c).substring(0, 15),
                            'name'  => pf.Facility__r != null ? pf.Facility__r.Name : ''
                        };
                        facilitiesList.add(facMap);
                    }
                }
            }

            // ── Step 7: Build Authentication Payload ──
            Map<String, Object> body = new Map<String, Object>{
                'sf_user_id'         => currentUser.Id,
                'sf_username'        => currentUser.Username,
                'sf_email'           => currentUser.Email,
                'sf_full_name'       => String.isNotBlank(currentUser.Full_Name__c)
                                            ? currentUser.Full_Name__c : currentUser.Name,
                'sf_user_type'       => currentUser.User_Type__c,
                'sf_type_of_user'    => currentUser.Type_of_User__c,
                'sf_user_role_name' => currentUser.User_Role__c,
                'organisation'       => orgMap,
                'staff_id'           => staffId,
                'participant_id'     => participantId,
                'facilities'         => facilitiesList,
                'managed_facilities' => managedFacilitiesList,
                'staff_facilities'   => staffFacilitiesList,
                'environment'        => System.Label.Environment_Label
            };

            // Call Tessa AI login endpoint via Named Credential
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:Tessa_AI_API/auth/sf-login');
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('Accept', 'application/json');
            req.setHeader('X-SF-Secret', 'hyEcF-lTIIEiL3wnMzK9eYHxVaEkyCw_MRuAAwx4eFk');
            req.setBody(JSON.serialize(body));
            req.setTimeout(30000);

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 200) {

                Map<String, Object> response =
                    (Map<String, Object>) JSON.deserializeUntyped(res.getBody());

                // Enrich response with profile picture
                Map<String, Object> user =
                    (Map<String, Object>) response.get('user');

                if (user == null) {                    user = new Map<String, Object>();
                }

                user.put('user_picture', profilePicture);

                response.put('user', user);

                return JSON.serialize(response);

            } else {
                Map<String, String> err = new Map<String, String>{
                    'error' => 'Auth failed (' + res.getStatusCode() + '): ' + res.getBody()
                };
                return JSON.serialize(err);
            }
        } catch (Exception e) {
            Map<String, String> err = new Map<String, String>{
                'error' => 'Error: ' + e.getMessage()
            };
            return JSON.serialize(err);
        }
    }
    /**
     * Get an authentication token for the current Salesforce user.
     * Called by the tessaAiChat LWC on load.
     *
     * @return JSON string containing token + user info, or error
     */


    /**
     * Optional: Send a chat message via Apex (for platforms that block CORS).
     * The LWC calls the API directly by default, but this is a fallback.
     */
    @AuraEnabled
    public static String sendChatMessage(String token, String path, String bodyJson) {
        try {
            HttpRequest req = new HttpRequest();
            req.setEndpoint('callout:Tessa_AI_API' + path);
            req.setMethod('POST');
            req.setHeader('Content-Type', 'application/json');
            req.setHeader('Authorization', 'Bearer ' + token);
            req.setHeader('X-SF-Secret', 'hyEcF-lTIIEiL3wnMzK9eYHxVaEkyCw_MRuAAwx4eFk');
            req.setBody(bodyJson);
            req.setTimeout(120000);

            Http http = new Http();
            HttpResponse res = http.send(req);

            return res.getBody();
        } catch (Exception e) {
            Map<String, String> err = new Map<String, String>{
                'error' => e.getMessage()
            };
            return JSON.serialize(err);
        }
    }
}