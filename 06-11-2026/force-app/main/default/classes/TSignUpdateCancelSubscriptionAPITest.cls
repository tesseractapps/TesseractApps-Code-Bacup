@isTest
private class TSignUpdateCancelSubscriptionAPITest {

    private static final String ORG_EMAIL = 'api.cancel.test@example.com';

    @testSetup
    static void setupData() {
        TSign_Organisation__c org = new TSign_Organisation__c(
            Name = 'API Test Org ' + DateTime.now().getTime(),
            Account_Type__c = 'Organisation',
            Active__c = true,
            Email__c = ORG_EMAIL
        );
        insert org;

        insert new TSign_Subscription__c(
            TSign_Organisation__c = org.Id,
            Active__c = true,
            Stripe_Invoice_Number__c = 'OLD-INV-123'
        );
    }

    // helper - set the REST request with a body
    private static RestResponse setRequest(String body, String method) {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/user/updateCancelSubscription/';
        req.httpMethod = method;
        req.requestBody = Blob.valueOf(body);
        RestContext.request = req;
        RestContext.response = res;
        return res;
    }

    // ==================================================================
    // POST updateSubscription
    // ==================================================================
    @isTest
    static void testUpdateSubscription_EmptyBody() {
        RestResponse res = setRequest('', 'POST');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.updateSubscription();
        Test.stopTest();
        System.debug('updateSubscription EmptyBody - ' + res.statusCode + ' ' + res.responseBody.toString());
    }

    @isTest
    static void testUpdateSubscription_MissingEmail() {
        RestResponse res = setRequest(JSON.serialize(new Map<String, Object>{ 'invoiceUrl' => 'https://test.com' }), 'POST');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.updateSubscription();
        Test.stopTest();
        System.debug('updateSubscription MissingEmail - ' + res.statusCode + ' ' + res.responseBody.toString());
    }

    @isTest
    static void testUpdateSubscription_OrgNotFound() {
        RestResponse res = setRequest(JSON.serialize(new Map<String, Object>{ 'email' => 'missingorg@example.com' }), 'POST');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.updateSubscription();
        Test.stopTest();
        System.debug('updateSubscription OrgNotFound - ' + res.statusCode + ' ' + res.responseBody.toString());
    }

    @isTest
    static void testUpdateSubscription_Success() {
        RestResponse res = setRequest(JSON.serialize(new Map<String, Object>{
            'email' => ORG_EMAIL,
            'invoiceUrl' => 'https://invoice.stripe.com/new',
            'invoiceId' => 'in_new123',
            'invoiceNumber' => 'INV-999',
            'stripePriceId' => 'price_xyz',
            'subscriptionId' => 'sub_abc',
            'invoiceAmountPaid' => '150.00',
            'currentPeriodStart' => '2024-01-01T00:00:00Z',
            'currentPeriodEnd' => '2024-02-01T00:00:00Z'
        }), 'POST');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.updateSubscription();
        Test.stopTest();
        System.debug('updateSubscription Success - ' + res.statusCode + ' ' + res.responseBody.toString());
    }

    @isTest
    static void testUpdateSubscription_Error() {
        RestResponse res = setRequest('{ not json', 'POST');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.updateSubscription();
        Test.stopTest();
        System.debug('updateSubscription Error - ' + res.statusCode + ' ' + res.responseBody.toString());
    }

    // ==================================================================
    // PATCH cancelSubscription
    // ==================================================================
    @isTest
    static void testCancel_EmptyBody() {
        RestResponse res = setRequest('', 'PATCH');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.cancelSubscription();
        Test.stopTest();
        System.debug('cancel EmptyBody - ' + res.statusCode + ' ' + res.responseBody.toString());
    }

    @isTest
    static void testCancel_MissingFields() {
        RestResponse res = setRequest(JSON.serialize(new Map<String, Object>{ 'email' => ORG_EMAIL }), 'PATCH');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.cancelSubscription();
        Test.stopTest();
        System.debug('cancel MissingFields - ' + res.statusCode + ' ' + res.responseBody.toString());
    }

    @isTest
    static void testCancel_OrgNotFound() {
        RestResponse res = setRequest(JSON.serialize(new Map<String, Object>{
            'email' => 'missingorg@example.com', 'subscriptionId' => 'sub_abc', 'status' => 'active',
            'cancel_at_period_end' => true
        }), 'PATCH');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.cancelSubscription();
        Test.stopTest();
        System.debug('cancel OrgNotFound - ' + res.statusCode + ' ' + res.responseBody.toString());
    }

    // trial cancelled now - org cancelled, subscription records inactive with end date
    @isTest
    static void testCancel_TrialNow() {
        RestResponse res = setRequest(JSON.serialize(new Map<String, Object>{
            'email' => ORG_EMAIL, 'subscriptionId' => 'sub_abc', 'customer' => 'cus_test123',
            'status' => 'canceled', 'cancel_at_period_end' => false,
            'canceled_at' => 1762248600, 'user_email' => 'admin@example.com'
        }), 'PATCH');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.cancelSubscription();
        Test.stopTest();
        System.debug('cancel TrialNow - ' + res.statusCode + ' ' + res.responseBody.toString());
        System.debug('cancel TrialNow - org ' + [SELECT Is_Cancelled__c, Trial_Period__c, Plan_End_Date__c, Stripe_Customer_ID__c
                                                 FROM TSign_Organisation__c WHERE Email__c = :ORG_EMAIL]);
        System.debug('cancel TrialNow - active subscriptions ' + [SELECT COUNT() FROM TSign_Subscription__c WHERE Active__c = true]);
    }

    // trial cancelled now, no canceled_at - end date today
    @isTest
    static void testCancel_TrialNowNoDate() {
        RestResponse res = setRequest(JSON.serialize(new Map<String, Object>{
            'email' => ORG_EMAIL, 'subscriptionId' => 'sub_abc', 'status' => 'canceled', 'cancel_at_period_end' => false
        }), 'PATCH');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.cancelSubscription();
        Test.stopTest();
        System.debug('cancel TrialNowNoDate - ' + res.statusCode + ' ' + res.responseBody.toString());
        System.debug('cancel TrialNowNoDate - plan end date '
            + [SELECT Plan_End_Date__c FROM TSign_Organisation__c WHERE Email__c = :ORG_EMAIL].Plan_End_Date__c);
    }

    // paid cancel at period end - org cancelled, subscription stays active
    @isTest
    static void testCancel_PeriodEnd() {
        RestResponse res = setRequest(JSON.serialize(new Map<String, Object>{
            'email' => ORG_EMAIL, 'subscriptionId' => 'sub_abc', 'status' => 'active',
            'cancel_at_period_end' => true, 'cancel_at' => 1764527400
        }), 'PATCH');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.cancelSubscription();
        Test.stopTest();
        System.debug('cancel PeriodEnd - ' + res.statusCode + ' ' + res.responseBody.toString());
        System.debug('cancel PeriodEnd - active subscriptions ' + [SELECT COUNT() FROM TSign_Subscription__c WHERE Active__c = true]);
    }

    // resume - existing Meta JSON kept, Is_Cancelled__c false
    @isTest
    static void testCancel_Resume() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c WHERE Email__c = :ORG_EMAIL];
        update new TSign_Organisation__c(Id = org.Id, Is_Cancelled__c = true, Meta_Data_Deatils__c = '{"web":"value"}');

        RestResponse res = setRequest(JSON.serialize(new Map<String, Object>{
            'email' => ORG_EMAIL, 'subscriptionId' => 'sub_abc', 'status' => 'active', 'cancel_at_period_end' => false
        }), 'PATCH');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.cancelSubscription();
        Test.stopTest();
        System.debug('cancel Resume - ' + res.statusCode + ' ' + res.responseBody.toString());
        System.debug('cancel Resume - org ' + [SELECT Is_Cancelled__c, Meta_Data_Deatils__c FROM TSign_Organisation__c WHERE Id = :org.Id]);
    }

    // Meta not a JSON object (list) - Meta left unchanged
    @isTest
    static void testCancel_MetaNotObject() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c WHERE Email__c = :ORG_EMAIL];
        update new TSign_Organisation__c(Id = org.Id, Meta_Data_Deatils__c = '[1,2]');

        RestResponse res = setRequest(JSON.serialize(new Map<String, Object>{
            'email' => ORG_EMAIL, 'subscriptionId' => 'sub_abc', 'status' => 'active', 'cancel_at_period_end' => true
        }), 'PATCH');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.cancelSubscription();
        Test.stopTest();
        System.debug('cancel MetaNotObject - ' + res.statusCode + ' ' + res.responseBody.toString());
    }

    // Meta not JSON at all - Meta left unchanged
    @isTest
    static void testCancel_MetaNotJson() {
        TSign_Organisation__c org = [SELECT Id FROM TSign_Organisation__c WHERE Email__c = :ORG_EMAIL];
        update new TSign_Organisation__c(Id = org.Id, Meta_Data_Deatils__c = 'plain text');

        RestResponse res = setRequest(JSON.serialize(new Map<String, Object>{
            'email' => ORG_EMAIL, 'subscriptionId' => 'sub_abc', 'status' => 'active', 'cancel_at_period_end' => true
        }), 'PATCH');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.cancelSubscription();
        Test.stopTest();
        System.debug('cancel MetaNotJson - ' + res.statusCode + ' ' + res.responseBody.toString());
    }

    @isTest
    static void testCancel_Error() {
        RestResponse res = setRequest('{ not json', 'PATCH');
        Test.startTest();
        TSignUpdateCancelSubscriptionAPI.cancelSubscription();
        Test.stopTest();
        System.debug('cancel Error - ' + res.statusCode + ' ' + res.responseBody.toString());
    }
}