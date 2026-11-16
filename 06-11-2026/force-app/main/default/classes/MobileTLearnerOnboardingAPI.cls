@RestResource(urlMapping='/v1/mobile/tlearner/onboarding')
global with sharing class MobileTLearnerOnboardingAPI {

    @HttpGet
    global static void fetchOnboardingTutorials() {
        RestResponse res = RestContext.response;

        try {
            Id userId = UserInfo.getUserId();

            // 🔹 1. Get user details
            User currentUser = [
                SELECT Id,
                       User_Role__c,
                       User_Type__c,
                       Organization_Name__c
                FROM User
                WHERE Id = :userId
                LIMIT 1
            ];

            // 🔹 Guard: user must have org
            if (String.isBlank(currentUser.Organization_Name__c)) { sendError(res, 400, 'User organization not set'); return;
            }

            // 🔹 2. Resolve Organisation Id
            Organisation__c orgRec;
            try {
                orgRec = [ SELECT Id, Name FROM Organisation__c WHERE Name = :currentUser.Organization_Name__c LIMIT 1 ]; } catch (Exception e) { sendError(res, 404, 'Matching organisation not found');return;}

            // 🔹 3. Role logic (MATCHES YOUR LWC)
            String roleFilter;

            if (currentUser.User_Role__c == 'Portal Account Partner User') { roleFilter = 'Staff';
            } else {
                roleFilter = null; // privileged users see all
            }

            // 🔹 4. Query TLearner
            List<Tlearner__c> learners;

            if (String.isBlank(roleFilter)) {
                learners = [
                    SELECT Id,
                           Name,
                           Platform__c,
                    	   Title__c,
                           Role__c,
                           AWS_Json__c,
                           Expire_Date__c,
                           Organization__c
                    FROM Tlearner__c
                    WHERE Organization__c = :orgRec.Id
                    AND (Expire_Date__c = NULL OR Expire_Date__c >= TODAY)
                    ORDER BY CreatedDate DESC
                    LIMIT 200
                ];
            } else {
                learners = [
                    SELECT Id,
                           Name,
                           Platform__c,
                    	   Title__c,
                           Role__c,
                           AWS_Json__c,
                           Expire_Date__c,
                           Organization__c
                    FROM Tlearner__c
                    WHERE Organization__c = :orgRec.Id
                    AND Role__c = :roleFilter
                    AND (Expire_Date__c = NULL OR Expire_Date__c >= TODAY)
                    ORDER BY CreatedDate DESC
                    LIMIT 200
                ];
            }

            // 🔹 5. Success response
            res.statusCode = 200;
            res.addHeader('Content-Type', 'application/json');
            res.responseBody = Blob.valueOf(JSON.serialize(learners)); } catch (Exception e) { System.debug('❌ MobileTLearnerOnboardingAPI error: ' + e.getMessage()); sendError(res, 500, e.getMessage());}}private static void sendError(RestResponse res, Integer code, String message) {res.statusCode = code;res.addHeader('Content-Type', 'application/json');res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{'success' => false,'message' => message
            })
        );
    }
}