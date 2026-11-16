@RestResource(urlMapping='/MobileFacilityAPI/*')
global class MobileFacilityAPI {

    /* =========================================================
     * FACILITY RESPONSE WRAPPER
     * ========================================================= */
    global class FacilityWrapper {
        public String displayName;
        public String facilityId;

        public FacilityWrapper(
            String displayName,
            String facilityId
        ) {
            this.displayName = displayName;
            this.facilityId = facilityId;
        }
    }


    /* =========================================================
     * MOBILE SETTINGS WRAPPER
     * ========================================================= */
    global class MobileSettingWrapper {
        public Boolean requestSignIn;
        public Boolean requestSignOut;

        public MobileSettingWrapper(
            Boolean requestSignIn,
            Boolean requestSignOut
        ) {
            this.requestSignIn = requestSignIn;
            this.requestSignOut = requestSignOut;
        }
    }


    /* =========================================================
     * FINAL RESPONSE WRAPPER
     * ========================================================= */
    global class FacilityResponseWrapper {
        public List<FacilityWrapper> facilities;
        public Map<String, MobileSettingWrapper> mobileSettings;

        public FacilityResponseWrapper() {
            facilities = new List<FacilityWrapper>();
            mobileSettings = new Map<String, MobileSettingWrapper>();
        }
    }


    /* =========================================================
     * GET FACILITIES
     * ========================================================= */
    @HttpGet
    global static void getFacilities() {

        RestResponse res = RestContext.response;

        Map<String, Object> errorResult =
            new Map<String, Object>();

        try {

            /* -------------------------------------------------
             * 1. FETCH CURRENT USER
             * ------------------------------------------------- */
            User currentUser = [
                SELECT Id, Organization_Name__c, User_Type__c
                FROM User
                WHERE Id = :UserInfo.getUserId()
                LIMIT 1
            ];

            System.debug(
                'Current User Id: ' + currentUser.Id
            );

            System.debug(
                'Current User Type: ' + currentUser.User_Type__c
            );


            /* -------------------------------------------------
             * 2. PREPARE FACILITY LIST
             * ------------------------------------------------- */
            List<Facility__c> facilityList =new List<Facility__c>();


            /* -------------------------------------------------
             * 3. CHECK NDIS ORG ADMIN
             * ------------------------------------------------- */
            Boolean isNdisOrgAdmin = currentUser.User_Type__c == 'NDIS Org Admin';


            /* =================================================
             * 4. NDIS ORG ADMIN
             *
             * Fetch all active facilities belonging to the
             * user's organisation.
             * ================================================= */
            if (isNdisOrgAdmin) {

                System.debug('User is NDIS Org Admin');

                /* -------------------------------------------------
                 * FETCH ORGANISATION
                 * ------------------------------------------------- */
                List<Organisation__c> organisationList = [ SELECT Id, Name FROM Organisation__c WHERE Name = :currentUser.Organization_Name__c LIMIT 1 ];

                Id organisationId =organisationList[0].Id;


                /* -------------------------------------------------
                 * FETCH ACTIVE FACILITIES
                 * ------------------------------------------------- */
                facilityList = [ SELECT Id, Name, Facility_Preferred_Name_Formula__c, Enable_Sign_In_Request__c, Enable_Sign_out_Request__c FROM Facility__c WHERE Organisation__c = :organisationId AND Status__c = TRUE ORDER BY Name ASC];

            }


            /* =================================================
             * 5. OTHER USERS
             *
             * Fetch facilities through Facility Association.
             * ================================================= */
            else { System.debug( 'User is not NDIS Org Admin');


                List<Facility_Association__c>
                    facilityAssociations = [ SELECT Id, Facility__c FROM Facility_Association__c
                    WHERE User__c = :currentUser.Id AND Active__c = TRUE AND Facility__r.Status__c = TRUE ];


                /* -------------------------------------------------
                 * COLLECT FACILITY IDS
                 * ------------------------------------------------- */
                Set<Id> facilityIds = new Set<Id>();


                for ( Facility_Association__c association : facilityAssociations ) {

                    if (association.Facility__c != null) {

                        facilityIds.add(association.Facility__c);
                    }
                }


                /* -------------------------------------------------
                 * FETCH FACILITIES
                 * ------------------------------------------------- */
                if (!facilityIds.isEmpty()) {

                    facilityList = [SELECT Id, Name, Facility_Preferred_Name_Formula__c, Enable_Sign_In_Request__c,
                               Enable_Sign_out_Request__c
                        FROM Facility__c
                        WHERE Id IN :facilityIds
                          AND Status__c = TRUE
                        ORDER BY Name ASC
                    ];
                }
            }


            /* =================================================
             * 6. BUILD RESPONSE
             * ================================================= */
            FacilityResponseWrapper response = new FacilityResponseWrapper();


            for (Facility__c facility : facilityList) {

                /* -------------------------------------------------
                 * DISPLAY NAME
                 *
                 * Use preferred name if available.
                 * Otherwise use Facility Name.
                 * ------------------------------------------------- */
                String displayName = facility.Name;
               
                /* -------------------------------------------------
                 * FACILITY LIST
                 * ------------------------------------------------- */
                response.facilities.add( new FacilityWrapper( displayName, String.valueOf(facility.Id))
                );


                /* -------------------------------------------------
                 * MOBILE SETTINGS
                 * ------------------------------------------------- */
                response.mobileSettings.put(  String.valueOf(facility.Id), new MobileSettingWrapper( facility.Enable_Sign_In_Request__c == true,facility.Enable_Sign_out_Request__c == true
                   ) );
            }


            /* =================================================
             * 7. RETURN RESPONSE
             * ================================================= */
            sendResponse(
                res,
                response
            );


        } catch (Exception e) {

            System.debug(
                'MobileFacilityAPI Error: ' +
                e.getMessage()
            );

            System.debug(
                'Stack Trace: ' +
                e.getStackTraceString()
            );


            errorResult.put(
                'errorMessage',
                e.getMessage()
            );


            sendResponse(
                res,
                errorResult
            );
        }
    }


    /* =========================================================
     * COMMON RESPONSE HANDLER
     * ========================================================= */
    private static void sendResponse(
        RestResponse res,
        Object payload
    ) {

        res.statusCode = 200;

        res.responseBody =
            Blob.valueOf(
                JSON.serialize(payload)
            );
    }
    
    @HttpPost
global static void updateFacilityMobileSettings() {

    RestResponse res = RestContext.response;
    Map<String, Object> result = new Map<String, Object>();

    try {

        /* -------------------------------------------------
         * 1. READ REQUEST PARAMETERS
         * ------------------------------------------------- */
        RestRequest req = RestContext.request;

        String facilityId = req.params.get('facilityId');
        String requestSignIn = req.params.get('requestSignIn');
        String requestSignOut = req.params.get('requestSignOut');


        /* -------------------------------------------------
         * 2. VALIDATE PARAMETERS
         * ------------------------------------------------- */
        if (String.isBlank(facilityId)) {
            result.put(
                'errorMessage',
                'Facility Id is required.'
            );

            sendResponse(res, result);
            return;
        }

        if (String.isBlank(requestSignIn)) {
            result.put(
                'errorMessage',
                'requestSignIn is required.'
            );

            sendResponse(res, result);
            return;
        }

        if (String.isBlank(requestSignOut)) {
            result.put(
                'errorMessage',
                'requestSignOut is required.'
            );

            sendResponse(res, result);
            return;
        }


        /* -------------------------------------------------
         * 3. CONVERT BOOLEAN VALUES
         * ------------------------------------------------- */
        Boolean enableSignIn =
            Boolean.valueOf(requestSignIn);

        Boolean enableSignOut =
            Boolean.valueOf(requestSignOut);


        /* -------------------------------------------------
         * 4. FETCH FACILITY
         * ------------------------------------------------- */
        Facility__c facility = [
            SELECT Id,
                   Name,
                   Enable_Sign_In_Request__c,
                   Enable_Sign_out_Request__c
            FROM Facility__c
            WHERE Id = :facilityId
            LIMIT 1
        ];


        /* -------------------------------------------------
         * 5. UPDATE FACILITY
         * ------------------------------------------------- */
        facility.Enable_Sign_In_Request__c =
            enableSignIn;

        facility.Enable_Sign_out_Request__c =
            enableSignOut;


        update facility;


        /* -------------------------------------------------
         * 6. SUCCESS RESPONSE
         * ------------------------------------------------- */
        result.put(
            'success',
            true
        );

        result.put(
            'message',
            'Facility mobile settings updated successfully.'
        );

        result.put(
            'facilityId',
            facility.Id
        );

        result.put(
            'requestSignIn',
            facility.Enable_Sign_In_Request__c
        );

        result.put(
            'requestSignOut',
            facility.Enable_Sign_out_Request__c
        );


        sendResponse(
            res,
            result
        );


    } catch (Exception e) {

        result.put(
            'success',
            false
        );

        result.put(
            'errorMessage',
            e.getMessage()
        );

        sendResponse(
            res,
            result
        );
    }
}
}