@RestResource(urlMapping='/user/checkActiveUser/*')
global without sharing class TSignActiveUserCheckAPI {

    @HttpGet
    global static void checkActiveUser() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        res.addHeader('Content-Type', 'application/json');

        String emailParam = req.params.get('email');

        // 1. Validate Input
        if (String.isBlank(emailParam)) {
            res.statusCode = 400; // Bad Request
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'status' => 'error',
                'message' => 'Missing required parameter: email'
            }));
            return;
        }

        String cleanEmail = emailParam.trim().toLowerCase();

        try {
            // 2. Check if an ACTIVE User exists with this email
            List<User> existingUsers = [
                SELECT Id, FirstName, LastName, Email 
                FROM User 
                WHERE Email = :cleanEmail 
                AND IsActive = true 
                LIMIT 1
            ];

            // 3. Handle the Scenario (User Found)
            if (!existingUsers.isEmpty()) {
                User foundUser = existingUsers[0];

                res.statusCode = 200; // OK
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                    'status' => 'success',
                    'message' => 'Active user found.',
                    'firstName' => String.isNotBlank(foundUser.FirstName) ? foundUser.FirstName : '',
                    'lastName' => String.isNotBlank(foundUser.LastName) ? foundUser.LastName : ''
                }));
                return;
            }

            // 4. Handle User Not Found
            res.statusCode = 404; // Not Found
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'status' => 'not_found',
                'message' => 'No active user found with this email. Please contact the support team for assistance.'
            }));

        } catch (Exception e) {
            // 5. Handle Exceptions
            System.debug(LoggingLevel.ERROR, 'Active User Check Failed: ' + e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'status' => 'error',
                'message' => 'An internal error occurred: ' + e.getMessage()
            }));
        }
    }
}