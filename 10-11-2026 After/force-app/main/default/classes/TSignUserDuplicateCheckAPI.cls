@RestResource(urlMapping='/user/checkDuplicate/*')
global without sharing class TSignUserDuplicateCheckAPI {

    @HttpGet
    global static void checkDuplicate() {
        RestRequest req = RestContext.request;
        RestResponse res = RestContext.response;
        
        res.addHeader('Content-Type', 'application/json');

        String emailParam = req.params.get('email');

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
            // 1. Check if a CONTACT exists with this email
            List<Contact> existingContacts = [
                SELECT Id, Email 
                FROM Contact 
                WHERE Email = :cleanEmail 
                LIMIT 1
            ];

            // 2. Handle the Duplicate Scenario (Contact Found)
            if (!existingContacts.isEmpty()) {
                
                // Retrieve the phone number from a Custom Label. 
                // If the label doesn't exist, fallback to a default string.
               	 String supportPhone;
               // String supportPhone = Label.Support_Contact_Number;
                if (String.isBlank(supportPhone)) {
                    supportPhone = '+61 1300 000 000'; // Fallback number
                }

                res.statusCode = 200; // OK
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                    'status' => 'duplicate',
                    'message' => 'An account with this email already exists. Please contact us for assistance.',
                    'website' => 'https://tesseractapps.com.au',
                    'contactNumber' => supportPhone
                }));
                return;
            }

                      // 3. Handle No Contact Found: Query the Error Handling Object based on Email
            List<TSign_Error_handling__c> recentErrors = [
                SELECT Id, Name, Email__c, Error_Message__c, CreatedDate
                FROM TSign_Error_handling__c 
                WHERE Email__c = :cleanEmail
                ORDER BY CreatedDate DESC 
                LIMIT 1
            ];

            if (!recentErrors.isEmpty()) {
                TSign_Error_handling__c latestError = recentErrors[0];
                
                res.statusCode = 200; // OK
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                    'status' => 'not_found',
                    'message' => 'No contact found with this email.',
                    'latest_error_log' => new Map<String, Object>{
                        'error_number' => latestError.Name,
                        'error_email' => latestError.Email__c,
                        'error_message' => latestError.Error_Message__c,
                        'logged_date' => latestError.CreatedDate
                    }
                }));
                return;
            }

            // 4. Handle No Contact and No Error Logs Found
            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'status' => 'not_found',
                'message' => 'No contact found with this email. No recent error logs found.'
            }));

        } catch (Exception e) {
            System.debug(LoggingLevel.ERROR, 'Duplicate Check Failed: ' + e.getMessage());
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'status' => 'error',
                'message' => 'An internal error occurred: ' + e.getMessage()
            }));
        }
    }
    
  
}