@RestResource(urlMapping='/MobileAppIRData/*')
global without sharing class MobileAppIRData {

    @HttpGet
    global static IRResponse getIRData() {

        RestRequest req = RestContext.request;

        String type = req.params.get('type');
        String facilityId = req.params.get('facilityId');

        IRResponse response = new IRResponse();

        // -------------------------------
        // Logged-in User Org + Email
        // -------------------------------
        User u = [
            SELECT Organization_Name__c, Email, User_Type__c
            FROM User
            WHERE Id = :UserInfo.getUserId()
            AND IsActive = true
            LIMIT 1
        ];

        if (String.isBlank(u.Organization_Name__c)) {
            return response;
        }

        String orgName = u.Organization_Name__c;
        Id orgId;

        List<Organisation__c> orgList = [
            SELECT Id
            FROM Organisation__c
            WHERE Name = :orgName
            LIMIT 1
        ];
        
        if (!orgList.isEmpty()) {
            orgId = orgList[0].Id;
        }


        // ===============================
// FACILITIES (Logged-in Staff Only)
// ===============================
if (type == 'facility') {

    if (String.isBlank(u.Email)) {
        return response;
    }

    // Step 1: Find staff record for logged in user
    List<Staff__c> staffList = [
        SELECT Id
        FROM Staff__c
        WHERE Email_Address__c = :u.Email
        AND Organization_Full_Name__c = :orgName
        AND Status__c = true
        LIMIT 1
    ];

    if (staffList.isEmpty()) {
        return response;
    }

    Id staffId = staffList[0].Id;

    // Step 2: Get facilities via Staff_Facility__c
    List<Staff_Facility__c> staffFacilities = [
        SELECT Facility__r.Id,
               Facility__r.Name
        FROM Staff_Facility__c
        WHERE Staff__c = :staffId
        AND Active__c = true
        ORDER BY Facility__r.Name
    ];

    for (Staff_Facility__c sf : staffFacilities) {
        response.facilities.add(
            new FacilityWrapper(
                sf.Facility__r.Id,
                sf.Facility__r.Name
            )
        );
    }
}
        
// ===============================
// ORG FACILITIES ONLY
// ===============================
else if (type == 'orgFacilities') {

    if (orgId == null) {
        return response;
    }

    List<Facility__c> orgFacilities = [
        SELECT Id, Name
        FROM Facility__c
        WHERE Organisation__c = :orgId
        ORDER BY Name
    ];

    for (Facility__c fac : orgFacilities) {

        response.facilities.add(
            new FacilityWrapper(
                fac.Id,
                fac.Name
            )
        );
    }
}




        // ===============================
        // STAFF BY FACILITY
        // ===============================
else if (type == 'staff' && isValidId(facilityId)) {

    // --------------------------------------------------
    // Step 1: Fetch staff for facility (original logic)
    // --------------------------------------------------

    List<Staff_Facility__c> staffFacilities = [
        SELECT Staff__r.Id,
               Staff__r.Name,
               Staff__r.Last_Name__c,
               Staff__r.NameToDisplay__c,
               Staff__r.Email_Address__c,
               Staff__r.Organization_Full_Name__c,
               Staff__r.Status__c
        FROM Staff_Facility__c
        WHERE Facility__c = :facilityId
        AND Active__c = true
        AND Staff__r.Status__c = true
        AND Staff__r.Organization_Full_Name__c = :orgName
        ORDER BY Staff__r.NameToDisplay__c
    ];

    // --------------------------------------------------
    // Step 2: Collect staff emails
    // --------------------------------------------------

    Set<String> staffEmails = new Set<String>();

    for (Staff_Facility__c sf : staffFacilities) {
        if (sf.Staff__r != null && String.isNotBlank(sf.Staff__r.Email_Address__c)) {
            staffEmails.add(sf.Staff__r.Email_Address__c.toLowerCase());
        }
    }

    // --------------------------------------------------
    // Step 3: Query active users by email
    // --------------------------------------------------

    Map<String, Id> activeUserEmails = new Map<String, Id>();

    if (!staffEmails.isEmpty()) {

        for (User uRec : [
            SELECT Id, Email
            FROM User
            WHERE IsActive = true
            AND Email IN :staffEmails
        ]) {
            activeUserEmails.put(uRec.Email.toLowerCase(), uRec.Id);
        }
    }

    // --------------------------------------------------
    // Step 4: Only include staff that have active users
    // --------------------------------------------------

    for (Staff_Facility__c sf : staffFacilities) {

        if (
            sf.Staff__r != null &&
            String.isNotBlank(sf.Staff__r.Email_Address__c) &&
            activeUserEmails.containsKey(
                sf.Staff__r.Email_Address__c.toLowerCase()
            )
        ) {

            response.staff.add(
                new StaffLiteWrapper(
                    sf.Staff__r.Id,
                    sf.Staff__r.Name,
                    sf.Staff__r.Last_Name__c
                )
            );
        }
    }
}


        // ===============================
        // PARTICIPANTS BY FACILITY
        // ===============================
        else if (type == 'participant' && isValidId(facilityId)) {

            List<Participant_Facility__c> participantFacilities = [
                SELECT Participant__r.Id,
                       Participant__r.Name,
                       Participant__r.Email__c,
                       Participant__r.Organization_Name__c,
                       Participant__r.Status__c
                FROM Participant_Facility__c
                WHERE Facility__c = :facilityId
                AND Active__c = true
                AND Participant__r.Status__c = true
                ORDER BY Participant__r.Name
            ];

            for (Participant_Facility__c pf : participantFacilities) {
                response.participants.add(
                    new ParticipantWrapper(
                        pf.Participant__r.Id,
                        pf.Participant__r.Name,
                        pf.Participant__r.Email__c
                    )
                );
            }
        }

        // ===============================
        // LOGGED-IN STAFF PROFILE ✅ NEW
        // ===============================
        else if (type == 'loggedInStaff') {

            if (String.isBlank(u.Email)) {
                return response;
            }
            
            response.orgId = orgId;


            List<Staff__c> staffList = [
                SELECT Id,
                       Name,
                       Last_Name__c,
                       Email_Address__c,
                       Contact_Number__c,
                       Role__c,
                       Organization_Full_Name__c,
                       Status__c,
                          (
                       SELECT Id,
                              RoleName__c,
                              Active__c,
                              Facility__c,
                              Facility__r.Name
                       FROM StaffRoles__r
                       WHERE Active__c = true
                   )
                FROM Staff__c
                WHERE Email_Address__c = :u.Email
                AND Status__c = true
                AND Organization_Full_Name__c = :orgName
                LIMIT 1
            ];

           for (Staff__c st : staffList) {

    Map<Id, FacilityRoleWrapper> facilityRoleMap =
        new Map<Id, FacilityRoleWrapper>();

        if (st.StaffRoles__r != null) {
    
            for (StaffRole__c sr : st.StaffRoles__r) {
    
                if (sr.Facility__c == null) {
                    continue;
                }
    
                if (!facilityRoleMap.containsKey(sr.Facility__c)) {
    
                    facilityRoleMap.put(
                        sr.Facility__c,
                        new FacilityRoleWrapper(
                            sr.Facility__c,
                            sr.Facility__r.Name,
                            new List<String>()
                        )
                    );
                }
    
                facilityRoleMap.get(sr.Facility__c)
                    .roles
                    .add(sr.RoleName__c);
            }
        }
    
        response.loggedInStaff.add(
            new StaffWrapper(
                st.Id,
                st.Name,
                st.Last_Name__c,
                st.Email_Address__c,
                st.Contact_Number__c,
                st.Role__c,
                u.User_Type__c,
                facilityRoleMap.values()
            )
        );
    }
        }

        return response;
    }

    // ===============================
    // Helpers
    // ===============================
    private static Boolean isValidId(String idValue) {
        if (String.isBlank(idValue)) return false;
        try {
            Id.valueOf(idValue);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // ===============================
    // RESPONSE WRAPPER
    // ===============================
    global class IRResponse {
        global List<FacilityWrapper> facilities = new List<FacilityWrapper>();
        global List<StaffLiteWrapper> staff = new List<StaffLiteWrapper>();
        global List<StaffWrapper> loggedInStaff =
        new List<StaffWrapper>();
        global List<ParticipantWrapper> participants = new List<ParticipantWrapper>();
        global Id orgId;
    }

    // ===============================
    // INNER WRAPPERS
    // ===============================
    global class FacilityWrapper {
        global Id facilityId;
        global String facilityName;

        public FacilityWrapper(Id id, String name) {
            facilityId = id;
            facilityName = name;
        }
    }

    global class StaffWrapper {
        global Id staffId;
        global String firstName;
        global String lastName;
        global String email;
        global String contactNumber;
        global String role;
        global String userType;
        global List<FacilityRoleWrapper> facilityRoles;


       public StaffWrapper(
            Id id,
            String fName,
            String lName,
            String emailAddr,
            String contact,
            String roleVal,
            String userTypeVal,
            List<FacilityRoleWrapper> facilityRoleList
        ) {
            staffId = id;
            firstName = fName;
            lastName = lName;
            email = emailAddr;
            contactNumber = contact;
            role = roleVal;
            userType = userTypeVal;
            facilityRoles = facilityRoleList;
        }
    }

    global class ParticipantWrapper {
        global Id participantId;
        global String participantName;
        global String email;

        public ParticipantWrapper(Id id, String name, String emailAddr) {
            participantId = id;
            participantName = name;
            email = emailAddr;
        }
    }
    global class FacilityRoleWrapper {

    global Id facilityId;
    global String facilityName;
    global List<String> roles;

    public FacilityRoleWrapper(
        Id facId,
        String facName,
        List<String> roleList
    ) {
        facilityId = facId;
        facilityName = facName;
        roles = roleList;
    }
}
    
global class StaffLiteWrapper {
    global Id staffId;
    global String firstName;
    global String lastName;

    public StaffLiteWrapper(
        Id id,
        String fName,
        String lName
    ) {
        staffId = id;
        firstName = fName;
        lastName = lName;
    }
}


}