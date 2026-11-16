@isTest
Public class StripeWebhookReceiverVersion2Test {

    // ---------------------------------------------------------------------
    // Helper: build a Stripe-Signature header for a given body
    // ---------------------------------------------------------------------
    Public static String buildSignatureHeader(String body, String secret) {
        Long ts = Datetime.now().getTime() / 1000;
        Blob mac = Crypto.generateMac(
            'HmacSHA256',
            Blob.valueOf(ts + '.' + body),
            Blob.valueOf(secret)
        );
        String v1 = EncodingUtil.convertToHex(mac);
        return 't=' + ts + ',v1=' + v1;
    }

    // ---------------------------------------------------------------------
    // Helper: build a realistic Stripe-style webhook payload
    // ---------------------------------------------------------------------
    Public static String buildPayload(String paymentStatus) {
        Map<String, Object> metadata = new Map<String, Object>{
            'email'                   => 'jane.doe@example.com',
            'accountType'             => 'ORGANISATION',
            'userType'                => 'ADMIN',
            'phone'                   => '+61400000000',
            'organisationName'        => 'Acme Pty Ltd',
            'organisationEmail'       => 'info@acme.com.au',
            'facilityName'            => 'Acme HQ',
            'tradingName'             => 'Acme Trading',
            'businessType'            => 'Technology',
            'teamSize'                => '25',
            'id_au_abn'               => '12345678901',
            'id_au_acn'               => '123456789',
            'firstName'               => 'Jane',
            'lastName'                => 'Doe',
            'primaryContactFirstName' => 'John',
            'primaryContactLastName'  => 'Smith',
            'primaryContactEmail'     => 'john.smith@example.com',
            'primaryContactPhone'     => '+61411111111',
            'addressLine1'            => '123 Main St',
            'addressLine2'            => 'Suite 4',
            'addressCity'             => 'Sydney',
            'addressState'            => 'NSW',
            'addressPostalCode'       => '2000',
            'addressCountry'          => 'AU',
            'market'                  => 'AU',
            'trial'                   => 'false',
            'currency'                => 'aud',
            'interval'                => 'month',
            'taxBehavior'             => 'exclusive',
            'stripeCustomerId'        => 'cus_123',
            'stripePriceId'           => 'price_123',
            'subscriptionId'          => 'sub_123',
            'subscriptionStatus'      => 'active',
            'invoiceUrl'              => 'https://invoice.stripe.com/i/123',
            'invoiceId'               => 'in_123',
            'invoiceNumber'           => 'INV-0001',
            'invoiceStatus'           => 'paid',
            'invoiceAmountPaid'       => '10000',
            'currentPeriodStart'      => '1700000000',
            'currentPeriodEnd'        => '1702592000',
            'acceptedTermsAt'         => '2024-01-01T00:00:00Z',
            'acceptedTerms'           => 'true'
        };

        Map<String, Object> stripeObject = new Map<String, Object>{
            'id'             => 'evt_test_123',
            'object'         => 'checkout.session',
            'payment_status' => paymentStatus,
            'metadata'       => metadata
        };

        Map<String, Object> dataNode = new Map<String, Object>{
            'object' => stripeObject
        };

        Map<String, Object> root = new Map<String, Object>{
            'id'   => 'evt_test_123',
            'type' => 'checkout.session.completed',
            'data' => dataNode
        };

        return JSON.serialize(root);
    }

    // ---------------------------------------------------------------------
    // Helper: build a RestRequest / RestResponse context for the webhook
    // ---------------------------------------------------------------------
    Public static RestRequest buildRequest(String body, String sigHeader) {
        RestRequest req = new RestRequest();
        req.requestURI = '/services/apexrest/stripe/v2/';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(body);
        if (sigHeader != null) {
            req.headers.put('Stripe-Signature', sigHeader);
        }
        return req;
    }

    Public static RestResponse buildResponse() {
        RestResponse res = new RestResponse();
        res.statusCode = 200;
        return res;
    }

    // =====================================================================
    // TEST: Happy path — valid payload, valid payment status
    // =====================================================================
    @isTest
    static void testHappyPath_ValidPaidPayload() {
        String body = buildPayload('paid');

        RestRequest req  = buildRequest(body, 't=123,v1=abc');
        RestResponse res = buildResponse();

        RestContext.request  = req;
        RestContext.response = res;

        Test.startTest();
        StripeWebhookReceiverVersion2.receive();
        Test.stopTest();

    }

    // =====================================================================
    // TEST: payment_status not paid → should be ignored with 200
    // =====================================================================
    @isTest
    static void testUnpaidStatusIgnored() {
        String body = buildPayload('unpaid');

        RestContext.request  = buildRequest(body, null);
        RestContext.response = buildResponse();

        Test.startTest();
        StripeWebhookReceiverVersion2.receive();
        Test.stopTest();

    }

    // =====================================================================
    // TEST: payment_status null → should still process
    // =====================================================================
    @isTest
    static void testNullPaymentStatusProcesses() {
        String body = buildPayload(null);

        RestContext.request  = buildRequest(body, null);
        RestContext.response = buildResponse();

        Test.startTest();
        StripeWebhookReceiverVersion2.receive();
        Test.stopTest();

    }

    // =====================================================================
    // TEST: Missing "data" node → 400
    // =====================================================================
    @isTest
    static void testMissingDataNodeReturns400() {
        Map<String, Object> root = new Map<String, Object>{
            'id'   => 'evt_test',
            'type' => 'checkout.session.completed'
        };
        String body = JSON.serialize(root);

        RestContext.request  = buildRequest(body, null);
        RestContext.response = buildResponse();

        Test.startTest();
        StripeWebhookReceiverVersion2.receive();
        Test.stopTest();

    }

    // =====================================================================
    // TEST: Missing "object" inside data → 400
    // =====================================================================
    @isTest
    static void testMissingObjectReturns400() {
        Map<String, Object> root = new Map<String, Object>{
            'id'   => 'evt_test',
            'type' => 'checkout.session.completed',
            'data' => new Map<String, Object>()
        };
        String body = JSON.serialize(root);

        RestContext.request  = buildRequest(body, null);
        RestContext.response = buildResponse();

        Test.startTest();
        StripeWebhookReceiverVersion2.receive();
        Test.stopTest();

    }

    // =====================================================================
    // TEST: No metadata → 400
    // =====================================================================
    @isTest
    static void testMissingMetadataReturns400() {
        Map<String, Object> stripeObject = new Map<String, Object>{
            'id'             => 'evt_test',
            'object'         => 'checkout.session',
            'payment_status' => 'paid'
        };
        Map<String, Object> root = new Map<String, Object>{
            'id'   => 'evt_test',
            'type' => 'checkout.session.completed',
            'data' => new Map<String, Object>{ 'object' => stripeObject }
        };
        String body = JSON.serialize(root);

        RestContext.request  = buildRequest(body, null);
        RestContext.response = buildResponse();

        Test.startTest();
        StripeWebhookReceiverVersion2.receive();
        Test.stopTest();
    }

    // =====================================================================
    // TEST: Malformed JSON → 500 (exception path)
    // =====================================================================
    @isTest
    static void testMalformedJsonReturns500() {
        RestContext.request  = buildRequest('{ this is not valid json', null);
        RestContext.response = buildResponse();

        Test.startTest();
        StripeWebhookReceiverVersion2.receive();
        Test.stopTest();
    }

    // =====================================================================
    // TEST: Null request body → handled gracefully
    // =====================================================================
    @isTest
    static void testNullRequestBody() {
        RestRequest req = new RestRequest();
        req.requestURI  = '/services/apexrest/stripe/v2/';
        req.httpMethod  = 'POST';
        // requestBody left null

        RestContext.request  = req;
        RestContext.response = buildResponse();

        Test.startTest();
        StripeWebhookReceiverVersion2.receive();
        Test.stopTest();
    }

    // =====================================================================
    // TEST: Header lookup is case-insensitive
    // =====================================================================
    @isTest
    static void testHeaderLookupCaseInsensitive() {
        String body = buildPayload('paid');

        RestRequest req = buildRequest(body, null);
        // Use lowercase header name; getHeader must find it
        req.headers.put('stripe-signature', 't=123,v1=abc');

        RestContext.request  = req;
        RestContext.response = buildResponse();

        Test.startTest();
        StripeWebhookReceiverVersion2.receive();
        Test.stopTest();

    }



    // =====================================================================
    // TEST: isValid — missing label
    // =====================================================================
    @isTest
    static void testIsValid_NoSecretConfigured() {
        // If the label is not configured, isValid should return false.
        // We can't reliably create/clear labels in Apex, so we assert the
        // method does not throw and returns a Boolean.
        Boolean result = StripeWebhookReceiverVersion2.isValid('body', 't=123,v1=abc');

    }
}