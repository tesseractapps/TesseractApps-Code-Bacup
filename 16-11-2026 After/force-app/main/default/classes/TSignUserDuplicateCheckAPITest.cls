@isTest
private class TSignUserDuplicateCheckAPITest {

    // @testSetup
    // static void setupData() {
    //     // Create a base Organisation for the updateSubscription tests
    //     TSign_Organisation__c org = new TSign_Organisation__c(
    //         Name = 'API Test Org ' + DateTime.now().getTime(),
    //         Account_Type__c = 'Organisation',
    //         Active__c = true,
    //         Email__c = 'api.test.' + DateTime.now().getTime() + '@example.com'
    //     );
    //     insert org;
    // }

    // ==================================================================
    // TEST: checkDuplicate - Missing Email Parameter (400)
    // ==================================================================
    @isTest
    static void testCheckDuplicate_MissingEmail() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/user/checkDuplicate/';
        
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        TSignUserDuplicateCheckAPI.checkDuplicate();
        Test.stopTest();

        System.debug('checkDuplicate MissingEmail - StatusCode: ' + res.statusCode);
        System.debug('checkDuplicate MissingEmail - Body: ' + res.responseBody.toString());
    }

    // ==================================================================
    // TEST: checkDuplicate - Duplicate Contact Found (200)
    // ==================================================================
    @isTest
    static void testCheckDuplicate_ContactFound() {
        String email = 'duplicate.' + DateTime.now().getTime() + '@example.com';
        Account acct = new Account(Name = 'Test Acct ' + DateTime.now().getTime());
        insert acct;
        
        insert new Contact(LastName = 'Dup', Email = email, AccountId = acct.Id);

        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/user/checkDuplicate/';
        req.params.put('email', email);
        
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        TSignUserDuplicateCheckAPI.checkDuplicate();
        Test.stopTest();

        System.debug('checkDuplicate ContactFound - StatusCode: ' + res.statusCode);
        System.debug('checkDuplicate ContactFound - Body: ' + res.responseBody.toString());
    }

    // ==================================================================
    // TEST: checkDuplicate - Error Log Found (200)
    // ==================================================================
    @isTest
    static void testCheckDuplicate_ErrorLogFound() {
        String email = 'errorlog.' + DateTime.now().getTime() + '@example.com';
        
        insert new TSign_Error_handling__c(
            Email__c = email,
            Error_Message__c = 'API Test Error Message'
        );

        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/user/checkDuplicate/';
        req.params.put('email', email);
        
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        TSignUserDuplicateCheckAPI.checkDuplicate();
        Test.stopTest();

        System.debug('checkDuplicate ErrorLogFound - StatusCode: ' + res.statusCode);
        System.debug('checkDuplicate ErrorLogFound - Body: ' + res.responseBody.toString());
    }

    // ==================================================================
    // TEST: checkDuplicate - No Contact, No Error Log (200)
    // ==================================================================
    @isTest
    static void testCheckDuplicate_NotFound() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/user/checkDuplicate/';
        req.params.put('email', 'notfound.' + DateTime.now().getTime() + '@example.com');
        
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        TSignUserDuplicateCheckAPI.checkDuplicate();
        Test.stopTest();

        System.debug('checkDuplicate NotFound - StatusCode: ' + res.statusCode);
        System.debug('checkDuplicate NotFound - Body: ' + res.responseBody.toString());
    }

    // // ==================================================================
    // // TEST: updateSubscription - Empty Body (400)
    // // ==================================================================
    // @isTest
    // static void testUpdateSubscription_EmptyBody() {
    //     RestRequest req = new RestRequest();
    //     RestResponse res = new RestResponse();
    //     req.requestURI = '/services/apexrest/user/checkDuplicate/';
    //     req.requestBody = Blob.valueOf('');
        
    //     RestContext.request = req;
    //     RestContext.response = res;

    //     Test.startTest();
    //     TSignUserDuplicateCheckAPI.updateSubscription();
    //     Test.stopTest();

    //     System.debug('updateSubscription EmptyBody - StatusCode: ' + res.statusCode);
    //     System.debug('updateSubscription EmptyBody - Body: ' + res.responseBody.toString());
    // }

    // // ==================================================================
    // // TEST: updateSubscription - Missing Email in Payload (400)
    // // ==================================================================
    // @isTest
    // static void testUpdateSubscription_MissingEmail() {
    //     RestRequest req = new RestRequest();
    //     RestResponse res = new RestResponse();
    //     req.requestURI = '/services/apexrest/user/checkDuplicate/';
        
    //     Map<String, Object> payload = new Map<String, Object>{
    //         'invoiceUrl' => 'https://test.com'
    //     };
    //     req.requestBody = Blob.valueOf(JSON.serialize(payload));
        
    //     RestContext.request = req;
    //     RestContext.response = res;

    //     Test.startTest();
    //     TSignUserDuplicateCheckAPI.updateSubscription();
    //     Test.stopTest();

    //     System.debug('updateSubscription MissingEmail - StatusCode: ' + res.statusCode);
    //     System.debug('updateSubscription MissingEmail - Body: ' + res.responseBody.toString());
    // }

    // // ==================================================================
    // // TEST: updateSubscription - Org Not Found (404)
    // // ==================================================================
    // @isTest
    // static void testUpdateSubscription_OrgNotFound() {
    //     RestRequest req = new RestRequest();
    //     RestResponse res = new RestResponse();
    //     req.requestURI = '/services/apexrest/user/checkDuplicate/';
        
    //     Map<String, Object> payload = new Map<String, Object>{
    //         'email' => 'missingorg.' + DateTime.now().getTime() + '@example.com'
    //     };
    //     req.requestBody = Blob.valueOf(JSON.serialize(payload));
        
    //     RestContext.request = req;
    //     RestContext.response = res;

    //     Test.startTest();
    //     TSignUserDuplicateCheckAPI.updateSubscription();
    //     Test.stopTest();

    //     System.debug('updateSubscription OrgNotFound - StatusCode: ' + res.statusCode);
    //     System.debug('updateSubscription OrgNotFound - Body: ' + res.responseBody.toString());
    // }

    // // ==================================================================
    // // TEST: updateSubscription - Happy Path (200)
    // // ==================================================================
    // @isTest
    // static void testUpdateSubscription_Success() {
    //     TSign_Organisation__c org = [SELECT Id, Email__c FROM TSign_Organisation__c LIMIT 1];
        
    //     // Create an existing active subscription to test the deactivate logic
    //     insert new TSign_Subscription__c(
    //         TSign_Organisation__c = org.Id,
    //         Active__c = true,
    //         Stripe_Invoice_Number__c = 'OLD-INV-123'
    //     );

    //     RestRequest req = new RestRequest();
    //     RestResponse res = new RestResponse();
    //     req.requestURI = '/services/apexrest/user/checkDuplicate/';
        
    //     Map<String, Object> payload = new Map<String, Object>{
    //         'email' => org.Email__c,
    //         'invoiceUrl' => 'https://invoice.stripe.com/new',
    //         'invoiceId' => 'in_new123',
    //         'invoiceNumber' => 'INV-999',
    //         'stripePriceId' => 'price_xyz',
    //         'subscriptionId' => 'sub_abc',
    //         'invoiceAmountPaid' => '150.00',
    //         'currentPeriodStart' => '2024-01-01T00:00:00Z',
    //         'currentPeriodEnd' => '2024-02-01T00:00:00Z'
    //     };
    //     req.requestBody = Blob.valueOf(JSON.serialize(payload));
        
    //     RestContext.request = req;
    //     RestContext.response = res;

    //     Test.startTest();
    //     TSignUserDuplicateCheckAPI.updateSubscription();
    //     Test.stopTest();

    //     System.debug('updateSubscription Success - StatusCode: ' + res.statusCode);
    //     System.debug('updateSubscription Success - Body: ' + res.responseBody.toString());
    // }
}